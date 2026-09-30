import "server-only";

import { randomUUID } from "node:crypto";
import { getTrafficSourceLabel } from "@/lib/tracking/traffic-source";
import { GHL_API_KEY, GHL_LOCATION_ID, GHL_PIPELINE_ID, GHL_PIPELINE_STAGE_ID } from "@/lib/shared/env";
import { insertLead, type InsertLeadPayload } from "@/lib/leads/supabase";
import { syncLeadToGhl } from "@/lib/leads/ghl";
import type { LeadData } from "@/lib/leads/types";
import { validateAddressShape } from "@/lib/shared/address";
import { buildAddressBlockMessage, geocodeAddress } from "@/lib/leads/geocode";
import { ApiError } from "@/server/http/errors";
import {
  getLeadErrorById,
  persistRetryResult,
  setRetryBatchId,
} from "./lead-errors.repository";

const EDITABLE_FIELDS = new Set([
  "name",
  "phone",
  "email",
  "property_address",
  "market_slug",
  "situation_slug",
  "source",
  "timeline_to_sell",
  "listed_with_agent",
  "property_age",
]);

type EditedPayload = Record<string, string>;

export type LeadErrorRetryResult = {
  success: boolean;
  dbSuccess: boolean;
  ghlSuccess: boolean;
  ghlConfigured: boolean;
  duplicate: boolean;
  error: { code?: string; message?: string; details?: string | null } | null;
  ghlError: { message?: string } | null;
  warnings: string[];
  retryCount: number;
  retry_batch_id: string;
  beforeGhlSync: string;
};

function recordValue(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return recordValue(parsed);
    } catch {
      return {};
    }
  }
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

function optionalValue(raw: Record<string, unknown>, field: string, fallback: string | null): string | undefined {
  return stringValue(raw[field]) || stringValue(fallback);
}

function editablePayload(value: unknown): EditedPayload | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw ApiError.badRequest("modifiedPayload must be an object");
  }

  const payload: EditedPayload = {};
  for (const [key, fieldValue] of Object.entries(value)) {
    if (!EDITABLE_FIELDS.has(key) || typeof fieldValue !== "string") {
      throw ApiError.badRequest("Invalid modified lead field");
    }
    payload[key] = fieldValue;
  }
  return payload;
}

function leadDataForRetry(
  row: Awaited<ReturnType<typeof getLeadErrorById>>,
  modifiedPayload: EditedPayload | undefined,
): LeadData {
  const originalPayload = recordValue(row.payload);
  const rawLeadData = modifiedPayload ? { ...originalPayload, ...modifiedPayload } : originalPayload;
  const hasModifiedPayload = Boolean(modifiedPayload);
  const modifiedOptional = (field: string, fallback: string | null): string | undefined =>
    hasModifiedPayload && field in rawLeadData
      ? stringValue(rawLeadData[field])
      : optionalValue(rawLeadData, field, fallback);

  return {
    name: stringValue(rawLeadData.name) || row.name || "Unknown",
    phone: stringValue(rawLeadData.phone) || row.phone || "Unknown",
    email: modifiedOptional("email", row.email),
    market_slug: stringValue(rawLeadData.market_slug) || row.marketSlug || "unknown",
    situation_slug: stringValue(rawLeadData.situation_slug) || row.situationSlug || "unknown",
    source: stringValue(rawLeadData.source) || row.source || "unknown",
    address_source: stringValue(rawLeadData.address_source) || null,
    property_address: modifiedOptional("property_address", row.propertyAddress),
    listed_with_agent: modifiedOptional("listed_with_agent", null),
    property_age: modifiedOptional("property_age", null),
    timeline_to_sell: modifiedOptional("timeline_to_sell", null),
    page_path: stringValue(rawLeadData.page_path),
    utm_source: stringValue(rawLeadData.utm_source) || null,
    utm_medium: stringValue(rawLeadData.utm_medium) || null,
    utm_campaign: stringValue(rawLeadData.utm_campaign) || null,
    utm_content: stringValue(rawLeadData.utm_content) || null,
    utm_term: stringValue(rawLeadData.utm_term) || null,
    gclid: stringValue(rawLeadData.gclid) || null,
    gbraid: stringValue(rawLeadData.gbraid) || null,
    wbraid: stringValue(rawLeadData.wbraid) || null,
    fbclid: stringValue(rawLeadData.fbclid) || null,
    msclkid: stringValue(rawLeadData.msclkid) || null,
    tz_browser: stringValue(rawLeadData.tz_browser) || null,
    tz_ip: stringValue(rawLeadData.tz_ip) || null,
    seller_state: stringValue(rawLeadData.seller_state) || null,
    seller_country: stringValue(rawLeadData.seller_country) || null,
    consent_transactional: rawLeadData.consent_transactional === true,
    consent_promotional: rawLeadData.consent_promotional === true,
  };
}

export async function retryLeadError(id: string, body: unknown): Promise<LeadErrorRetryResult> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw ApiError.badRequest("Invalid retry request");
  }
  const modifiedPayload = editablePayload((body as { modifiedPayload?: unknown }).modifiedPayload);
  const row = await getLeadErrorById(id);
  const retryBatchId = row.retryBatchId || randomUUID();
  await setRetryBatchId(row.id, retryBatchId);

  const leadData = leadDataForRetry(row, modifiedPayload);
  if (leadData.property_address) {
    const selectedFromGoogle = leadData.address_source === "google_selected" || leadData.address_source === "server_places_selected";
    const addressBlock = !validateAddressShape(leadData.property_address)
      ? buildAddressBlockMessage(leadData.property_address, "no_match", selectedFromGoogle)
      : null;
    const geocode = addressBlock ? null : await geocodeAddress(leadData.property_address);
    const verificationBlock = addressBlock || (geocode?.ok
      ? null
      : buildAddressBlockMessage(leadData.property_address, geocode?.error || "unknown", selectedFromGoogle));
    if (verificationBlock) {
      throw ApiError.unprocessableEntity(verificationBlock.error, {
        error_code: addressBlock ? "no_match" : geocode?.error || "unknown",
        message: verificationBlock.message,
        address: leadData.property_address,
      });
    }
  }

  const trafficSource = getTrafficSourceLabel(leadData);
  let dbSuccess = false;
  let duplicate = false;
  let dbError: LeadErrorRetryResult["error"] = null;
  try {
    const result = await insertLead(leadData as InsertLeadPayload);
    dbSuccess = result.success;
    duplicate = result.duplicate;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string; details?: string | null };
    dbError = { code: err.code, message: err.message, details: err.details || null };
  }

  let ghlSuccess = true;
  let ghlError: LeadErrorRetryResult["ghlError"] = null;
  const ghlConfigured = Boolean(
    GHL_API_KEY &&
      GHL_API_KEY !== "your_ghl_api_key_here" &&
      GHL_LOCATION_ID &&
      GHL_LOCATION_ID !== "your_ghl_location_id_here",
  );
  const beforeGhlSync = new Date();

  if (ghlConfigured) {
    try {
      const result = await syncLeadToGhl(
        leadData,
        {
          apiKey: GHL_API_KEY!,
          locationId: GHL_LOCATION_ID!,
          pipelineId: GHL_PIPELINE_ID,
          pipelineStageId: GHL_PIPELINE_STAGE_ID,
        },
        trafficSource,
        retryBatchId,
      );
      ghlSuccess = result.success;
      if (!ghlSuccess && result.error) ghlError = result.error;
    } catch (error: unknown) {
      const err = error as { message?: string };
      ghlSuccess = false;
      ghlError = { message: err.message || "Unknown GHL error" };
    }
  }

  const success = dbSuccess && ghlSuccess;
  await persistRetryResult({
    id: row.id,
    retryBatchId,
    retryCount: row.retryCount + 1,
    name: leadData.name,
    phone: leadData.phone,
    beforeGhlSync,
    success,
    dbError,
    ghlError,
  });

  return {
    success,
    duplicate,
    dbSuccess,
    ghlSuccess,
    ghlConfigured,
    error: dbError,
    ghlError,
    warnings: ghlSuccess ? [] : ["GHL sync failed on retry"],
    retryCount: row.retryCount + 1,
    retry_batch_id: retryBatchId,
    beforeGhlSync: beforeGhlSync.toISOString(),
  };
}
