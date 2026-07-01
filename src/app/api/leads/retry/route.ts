import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { getTrafficSourceLabel } from "@/lib/traffic-source";
import { GHL_API_KEY, GHL_LOCATION_ID, GHL_PIPELINE_ID, GHL_PIPELINE_STAGE_ID } from "@/lib/env";
import { insertLead, logLeadError } from "@/lib/leads/supabase";
import { syncLeadToGhl } from "@/lib/leads/ghl";

const TAG = "[API:leads/retry]";

export async function POST(request: NextRequest) {
  try {
    const { errorId, modifiedPayload } = await request.json();

    if (!errorId) {
      return NextResponse.json({ error: "Missing errorId" }, { status: 400 });
    }

    const { data: errorRecord, error: fetchError } = await supabase
      .from("lead_errors")
      .select("*")
      .eq("id", errorId)
      .maybeSingle();

    if (fetchError || !errorRecord) {
      console.error(`${TAG} Error record not found:`, errorId, fetchError);
      return NextResponse.json({ error: "Error record not found" }, { status: 404 });
    }

    if (errorRecord.resolved) {
      return NextResponse.json({ error: "This error has already been resolved" }, { status: 400 });
    }

    const payload = modifiedPayload || errorRecord.payload;
    if (!payload) {
      return NextResponse.json({ error: "No payload available for retry" }, { status: 400 });
    }

    const leadData = typeof payload === "string" ? JSON.parse(payload) : payload;
    const trafficSource = getTrafficSourceLabel(leadData);

    const insertPayload = {
      name: leadData.name || errorRecord.name || "Unknown",
      phone: leadData.phone || errorRecord.phone || "Unknown",
      email: leadData.email || errorRecord.email || null,
      market_slug: leadData.market_slug || errorRecord.market_slug || "unknown",
      situation_slug: leadData.situation_slug || errorRecord.situation_slug || "unknown",
      source: leadData.source || errorRecord.source || undefined,
      property_address: leadData.property_address || errorRecord.property_address || null,
      page_path: leadData.page_path || null,
      utm_source: leadData.utm_source || null,
      utm_medium: leadData.utm_medium || null,
      utm_campaign: leadData.utm_campaign || null,
      utm_content: leadData.utm_content || null,
      utm_term: leadData.utm_term || null,
      gclid: leadData.gclid || null,
      fbclid: leadData.fbclid || null,
      msclkid: leadData.msclkid || null,
      consent_transactional: leadData.consent_transactional ?? false,
      consent_promotional: leadData.consent_promotional ?? false,
    };

    let dbSuccess = false;
    let duplicate = false;
    try {
      const dbResult = await insertLead(insertPayload);
      dbSuccess = dbResult.success;
      duplicate = dbResult.duplicate;
    } catch (dbError: any) {
      console.error(`${TAG} DB insert failed on retry:`, dbError);
      await supabase
        .from("lead_errors")
        .update({
          retry_count: (errorRecord.retry_count || 0) + 1,
          last_retry_at: new Date().toISOString(),
          error_code: dbError.code || "RETRY_DB_ERROR",
          error_message: dbError.message || "DB insert failed on retry",
          error_details: dbError.details || null,
        })
        .eq("id", errorId);

      return NextResponse.json({
        success: false,
        error: "Database insert failed on retry",
        retry_count: (errorRecord.retry_count || 0) + 1,
      }, { status: 500 });
    }

    let ghlSuccess = true;
    const ghlKey = GHL_API_KEY;
    const ghlLocation = GHL_LOCATION_ID;
    const ghlConfigured = ghlKey && ghlKey !== "your_ghl_api_key_here" && ghlLocation && ghlLocation !== "your_ghl_location_id_here";

    if (ghlConfigured) {
      try {
        const ghlResult = await syncLeadToGhl(leadData, {
          apiKey: ghlKey!,
          locationId: ghlLocation!,
          pipelineId: GHL_PIPELINE_ID,
          pipelineStageId: GHL_PIPELINE_STAGE_ID,
        }, trafficSource);
        ghlSuccess = ghlResult.success;
      } catch (ghlError: any) {
        console.error(`${TAG} GHL sync failed on retry:`, ghlError);
        ghlSuccess = false;
      }
    }

    if (dbSuccess && ghlSuccess) {
      await supabase
        .from("lead_errors")
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          retry_count: (errorRecord.retry_count || 0) + 1,
          last_retry_at: new Date().toISOString(),
        })
        .eq("id", errorId);

      return NextResponse.json({
        success: true,
        duplicate,
        resolved: true,
      });
    }

    const warnings: string[] = [];
    if (!ghlSuccess) warnings.push("GHL sync failed on retry");

    await supabase
      .from("lead_errors")
      .update({
        retry_count: (errorRecord.retry_count || 0) + 1,
        last_retry_at: new Date().toISOString(),
      })
      .eq("id", errorId);

    return NextResponse.json({
      success: true,
      duplicate,
      resolved: false,
      warnings,
    });
  } catch (error) {
    console.error(`${TAG} Unexpected error:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
