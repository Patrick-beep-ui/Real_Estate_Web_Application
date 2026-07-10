import { parseAddress } from "@/lib/address";
import { describeGhlError } from "@/lib/errors/ghl";
import { logLeadError } from "./supabase";
import { notifyDuplicateOpportunity, notifyOpportunityFailed, notifyLeadError } from "./notifications";
import { splitName, areAddressesDifferent, buildErrorData } from "./helpers";
import { GHL_API_BASE_URL } from "@/lib/env";

const TAG = "[TBH:leads:ghl]";

export type GhlConfig = {
  apiKey: string;
  locationId: string;
  pipelineId?: string;
  pipelineStageId?: string;
};

export type GhlResult = {
  success: boolean;
  error?: { message: string; details?: string };
};

function buildGhlPayload(leadData: any, config: GhlConfig): Record<string, unknown> {
  const { name, phone, email, market_slug, situation_slug, source } = leadData;
  const { firstName, lastName } = splitName(name);
  const { property_address, utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbclid, msclkid, page_path, property_age, listed_with_agent, timeline_to_sell, consent_promotional, consent_transactional } = leadData;

  const customFields: Array<{ key: string; value: string }> = [];
  if (utm_source) customFields.push({ key: "utm_source", value: utm_source });
  if (utm_medium) customFields.push({ key: "utm_medium", value: utm_medium });
  if (utm_campaign) customFields.push({ key: "utm_campaign", value: utm_campaign });
  if (utm_content) customFields.push({ key: "utm_content", value: utm_content });
  if (utm_term) customFields.push({ key: "utm_term", value: utm_term });
  if (gclid) customFields.push({ key: "google_gclid", value: gclid });
  if (fbclid) customFields.push({ key: "fbclid", value: fbclid });
  if (msclkid) customFields.push({ key: "msclkid", value: msclkid });
  if (property_age) customFields.push({ key: "property_age_year_build", value: property_age });
  if (listed_with_agent) customFields.push({ key: "listed_with_another_realtor", value: listed_with_agent });
  if (timeline_to_sell) customFields.push({ key: "timeline_to_sell", value: timeline_to_sell });
  if (page_path) customFields.push({ key: "landing_page", value: page_path });
  if (consent_transactional !== undefined) customFields.push({ key: "optin_status", value: consent_transactional ? "Yes" : "No" });
  if (consent_promotional !== undefined) customFields.push({ key: "optin_marketing_status", value: consent_promotional ? "Yes" : "No" });
  const payload: Record<string, unknown> = {
    firstName,
    lastName,
    phone,
    locationId: config.locationId,
    tags: [
      "website: Tarek Buys Houses",
      `source:${source || "unknown"}`,
      `market:${market_slug || "unknown"}`,
      `situation:${situation_slug || "unknown"}`,
      "lead",
    ],
  };
  if (email) payload.email = email;
  if (property_address) {
    try {
      const parsed = parseAddress(property_address);
      payload.address1 = parsed.street;
      payload.city = parsed.city;
      payload.state = parsed.state;
      payload.postalCode = parsed.zip;
    } catch {
      console.warn(`${TAG} Failed to parse address:`, property_address);
    }
  }
  if (customFields.length > 0) payload.customFields = customFields;

  return payload;
}

function buildHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    Version: "2021-07-28",
  };
}

async function createContact(ghlPayload: Record<string, unknown>, config: GhlConfig): Promise<Response> {
  try {
    return await fetch(`${GHL_API_BASE_URL}/contacts`, {
      method: "POST",
      headers: buildHeaders(config.apiKey),
      body: JSON.stringify(ghlPayload),
    });
  } catch (err) {
    console.warn(`${TAG} createContact fetch failed:`, err instanceof Error ? err.message : err);
    throw err;
  }
}

async function getContact(contactId: string, config: GhlConfig): Promise<Record<string, any> | null> {
  try {
    const res = await fetch(`${GHL_API_BASE_URL}/contacts/${contactId}`, {
      headers: buildHeaders(config.apiKey),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.contact || null;
  } catch {
    return null;
  }
}

async function createOpportunity(contactId: string, contactName: string, leadData: any, config: GhlConfig): Promise<void> {
  if (!config.pipelineId || !config.pipelineStageId) {
    throw new Error("Pipeline ID or stage ID not configured");
  }
  const oppPayload: Record<string, unknown> = {
    pipelineId: config.pipelineId,
    locationId: config.locationId,
    name: leadData.property_address
      ? `${contactName} - ${leadData.property_address}`
      : contactName,
    pipelineStageId: config.pipelineStageId,
    status: "open",
    contactId,
  };

  const oppCustomFields: Array<{ key: string; value: string }> = [];
  if (leadData.property_address) {
    try {
      const parsed = parseAddress(leadData.property_address);
      if (parsed.street) oppCustomFields.push({ key: "street_address", value: parsed.street });
      if (parsed.city) oppCustomFields.push({ key: "city", value: parsed.city });
      if (parsed.state) oppCustomFields.push({ key: "state", value: parsed.state });
      if (parsed.zip) oppCustomFields.push({ key: "postal_code", value: parsed.zip });
      oppCustomFields.push({ key: "country", value: "US" });
    } catch {
      console.warn(`${TAG} Failed to parse opportunity address:`, leadData.property_address);
    }
  }
  if (leadData.utm_source) oppCustomFields.push({ key: "utm_source", value: leadData.utm_source });
  if (oppCustomFields.length > 0) oppPayload.customFields = oppCustomFields;

  try {
    const res = await fetch(`${GHL_API_BASE_URL}/opportunities/`, {
      method: "POST",
      headers: buildHeaders(config.apiKey),
      body: JSON.stringify(oppPayload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Opportunity creation failed");
    }
  } catch (err) {
    console.warn(`${TAG} createOpportunity fetch failed:`, err instanceof Error ? err.message : err);
    throw err;
  }
}

export async function syncLeadToGhl(leadData: any, config: GhlConfig, trafficSource: string, retryBatchId?: string): Promise<GhlResult> {
  const ghlPayload = buildGhlPayload(leadData, config);

  try {
    const response = await createContact(ghlPayload, config);

    if (response.ok) {
      console.log(`${TAG} ✔ GHL contact created`);
      return { success: true };
    }

    const errData = await response.json().catch(() => ({}));
    const isDuplicate = response.status === 400 && errData?.meta?.contactId;

    if (isDuplicate && config.pipelineId && config.pipelineStageId) {
      const contactId = errData.meta.contactId as string;
      const contactName = errData.meta.contactName || leadData.name;

      const existingContact = await getContact(contactId, config);

      if (existingContact) {
        const diff = areAddressesDifferent(existingContact, leadData.property_address);
        if (diff === false || diff === null) {
          const reason = diff === false ? "same address" : "no address to compare";
          console.log(`${TAG} GHL duplicate — ${reason}, skipping opportunity for contactId ${contactId}`);
          return { success: true };
        }
        console.log(`${TAG} GHL duplicate — different address, creating opportunity for contactId ${contactId}`);
      } else {
        console.warn(`${TAG} Failed to fetch existing contact ${contactId} — falling back to opportunity creation`);
      }

      try {
        await createOpportunity(contactId, contactName, leadData, config);
        console.log(`${TAG} ✔ GHL opportunity created for existing contact ${contactId}`);
        await notifyDuplicateOpportunity(leadData, trafficSource, contactId, contactName, errData.meta?.matchingField);
        return { success: true };
      } catch (oppErr) {
        console.error(`${TAG} GHL opportunity creation failed:`, oppErr);
        await logLeadError(buildErrorData(
          leadData,
          "GHL_OPPORTUNITY_ERROR",
          `Duplicate contact — opportunity creation failed: ${oppErr instanceof Error ? oppErr.message : "Unknown"}`,
          JSON.stringify({ contactId, originalError: errData }),
          retryBatchId,
        ));
        await notifyOpportunityFailed(leadData, trafficSource, contactId, oppErr);
        return { success: false };
      }
    }

    const status = response.status;
    const errMessage = errData.message || "Unknown error";
    console.error(`${TAG} GHL contact creation failed:`, { status, error: errData });
    await logLeadError(buildErrorData(
      leadData,
      "GHL_ERROR",
      `GHL contact creation failed: ${errMessage}`,
      JSON.stringify({ status, response: errData }),
      retryBatchId,
    ));
    await notifyLeadError(
      "Lead Submission Failed — GHL API Error",
      leadData,
      trafficSource,
      [
        `• Status: ${status}`,
        `• Message: ${describeGhlError(errData)}`,
        `• Match Field: ${errData.meta?.matchingField || "—"}`,
      ]
    );
    return { success: false, error: { message: errMessage, details: JSON.stringify({ status, response: errData }) } };
  } catch (err) {
    console.error(`${TAG} GHL fetch error:`, err);
    await logLeadError(buildErrorData(
      leadData,
      "GHL_FETCH_ERROR",
      err instanceof Error ? err.message : "Unknown error",
      err instanceof Error ? err.stack : String(err),
      retryBatchId,
    ));
    await notifyLeadError(
      "Lead Submission Failed — GHL Network Error",
      leadData,
      trafficSource,
      [
        `• Message: ${err instanceof Error ? err.message : "Unknown error"}`,
      ]
    );
    return { success: false, error: { message: err instanceof Error ? err.message : "Unknown error", details: err instanceof Error ? err.stack : String(err) } };
  }
}

