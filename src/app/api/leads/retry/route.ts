import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getTrafficSourceLabel } from "@/lib/traffic-source";
import { GHL_API_KEY, GHL_LOCATION_ID, GHL_PIPELINE_ID, GHL_PIPELINE_STAGE_ID } from "@/lib/env";
import { insertLead, type InsertLeadPayload } from "@/lib/leads/supabase";
import { syncLeadToGhl } from "@/lib/leads/ghl";
import { supabase } from "@/lib/supabase/client";
import type { LeadData } from "@/lib/leads/types";

const TAG = "[API:leads/retry]";

export async function POST(request: NextRequest) {
  try {
    const { errorRecord, modifiedPayload } = await request.json();

    if (!errorRecord?.id) {
      return NextResponse.json({ error: "Missing errorRecord.id" }, { status: 400 });
    }

    console.log(`Error record: ${JSON.stringify(errorRecord)}`)
    const retryBatchId = errorRecord.retry_batch_id || randomUUID();
    console.log(`Current batch for error record: ${errorRecord.retry_batch_id}`)
    console.log(`${TAG} batch Id created: ${retryBatchId}`);

    const { error: parentUpdateError } = await supabase
      .from("lead_errors")
      .update({ retry_batch_id: retryBatchId })
      .eq("id", errorRecord.id);

    if (parentUpdateError) {
      console.error(`${TAG} batch injection FAILED for ${errorRecord.id}:`, parentUpdateError);
    } else {
      console.log(`${TAG} batch injected for ${errorRecord.id}: ${retryBatchId}`);
    }

    const originalPayload = errorRecord.payload
      ? (typeof errorRecord.payload === "string" ? JSON.parse(errorRecord.payload) : errorRecord.payload)
      : {};

    const hasModifiedPayload = !!modifiedPayload;

    const rawLeadData = hasModifiedPayload
      ? { ...originalPayload, ...modifiedPayload }
      : originalPayload;

    const leadData: LeadData = {
      name: rawLeadData.name || errorRecord.name || "Unknown",
      phone: rawLeadData.phone || errorRecord.phone || "Unknown",
      email: hasModifiedPayload && "email" in rawLeadData
        ? rawLeadData.email || undefined
        : rawLeadData.email || errorRecord.email || undefined,
      market_slug: rawLeadData.market_slug || errorRecord.market_slug || "unknown",
      situation_slug: rawLeadData.situation_slug || errorRecord.situation_slug || "unknown",
      source: rawLeadData.source || errorRecord.source || "unknown",
      property_address: hasModifiedPayload && "property_address" in rawLeadData
        ? rawLeadData.property_address || undefined
        : rawLeadData.property_address || errorRecord.property_address || undefined,
      listed_with_agent: hasModifiedPayload && "listed_with_agent" in rawLeadData
        ? rawLeadData.listed_with_agent || undefined
        : rawLeadData.listed_with_agent || errorRecord.listed_with_agent || undefined,
      property_age: hasModifiedPayload && "property_age" in rawLeadData
        ? rawLeadData.property_age || undefined
        : rawLeadData.property_age || errorRecord.property_age || undefined,
      timeline_to_sell: hasModifiedPayload && "timeline_to_sell" in rawLeadData
        ? rawLeadData.timeline_to_sell || undefined
        : rawLeadData.timeline_to_sell || errorRecord.timeline_to_sell || undefined,
      page_path: rawLeadData.page_path || undefined,
      utm_source: rawLeadData.utm_source || null,
      utm_medium: rawLeadData.utm_medium || null,
      utm_campaign: rawLeadData.utm_campaign || null,
      utm_content: rawLeadData.utm_content || null,
      utm_term: rawLeadData.utm_term || null,
      gclid: rawLeadData.gclid || null,
      fbclid: rawLeadData.fbclid || null,
      msclkid: rawLeadData.msclkid || null,
      consent_transactional: rawLeadData.consent_transactional ?? false,
      consent_promotional: rawLeadData.consent_promotional ?? false,
      market_price: rawLeadData.market_price || errorRecord.market_price || null,
      lowest_price: rawLeadData.lowest_price || errorRecord.lowest_price || null,
    };

    console.log(`${TAG} retrying submission for:`, {
      name: leadData.name,
      phone: leadData.phone,
      rawLeadData,
    });

    const trafficSource = getTrafficSourceLabel(leadData);

    let dbSuccess = false;
    let duplicate = false;
    let dbError: any = null;
    try {
      const dbResult = await insertLead(leadData as InsertLeadPayload);
      dbSuccess = dbResult.success;
      duplicate = dbResult.duplicate;
    } catch (err: any) {
      console.error(`${TAG} DB insert failed on retry:`, err);
      dbError = { code: err.code, message: err.message, details: err.details || null };
    }

    let ghlSuccess = true;
    let ghlError: any = null;
    const ghlKey = GHL_API_KEY;
    const ghlLocation = GHL_LOCATION_ID;
    const ghlConfigured = ghlKey && ghlKey !== "your_ghl_api_key_here" && ghlLocation && ghlLocation !== "your_ghl_location_id_here";

    const beforeGhlSync = new Date().toISOString();

    if (ghlConfigured) {
      try {
        const ghlResult = await syncLeadToGhl(leadData, {
          apiKey: ghlKey!,
          locationId: ghlLocation!,
          pipelineId: GHL_PIPELINE_ID,
          pipelineStageId: GHL_PIPELINE_STAGE_ID,
        }, trafficSource, retryBatchId);
        ghlSuccess = ghlResult.success;
        if (!ghlSuccess && ghlResult.error) {
          ghlError = ghlResult.error;
        }
      } catch (err: any) {
        console.error(`${TAG} GHL sync failed on retry:`, err);
        ghlError = { message: err.message || "Unknown GHL error" };
        ghlSuccess = false;
      }
    }

    const warnings: string[] = [];
    if (!ghlSuccess) warnings.push("GHL sync failed on retry");

    const overallSuccess = dbSuccess && ghlSuccess;

    return NextResponse.json({
      success: overallSuccess,
      duplicate,
      warnings,
      dbSuccess,
      ghlSuccess,
      ghlConfigured,
      error: dbError,
      ghlError,
      retryCount: (errorRecord.retry_count || 0) + 1,
      retry_batch_id: retryBatchId,
      name: leadData.name,
      phone: leadData.phone,
      beforeGhlSync,
    }, { status: overallSuccess ? 200 : 500 });
  } catch (error) {
    console.error(`${TAG} Unexpected error:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

