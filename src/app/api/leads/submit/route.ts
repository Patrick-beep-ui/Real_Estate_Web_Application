import { NextRequest, NextResponse } from "next/server";
import { getTrafficSourceLabel } from "@/lib/traffic-source";
import { rateLimit } from "@/lib/rate-limit";
import { insertLead, logLeadError, checkIdempotencyKey, storeIdempotencyKey } from "@/lib/leads/supabase";
import { syncLeadToGhl } from "@/lib/leads/ghl";
import { validatePhone } from "@/lib/leads/helpers";
import { notifyLeadCaptured, notifyLeadPartial, notifyLeadError, notifyRateLimit } from "@/lib/leads/notifications";
import type { Json } from "@/lib/supabase/types";

const TAG = "[API:leads/submit]";

import {
  GHL_API_KEY,
  GHL_LOCATION_ID,
  GHL_API_BASE_URL,
  GHL_PIPELINE_ID,
  GHL_PIPELINE_STAGE_ID,
} from "@/lib/env";

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const MIN_RECAPTCHA_SCORE = 0.5;

function getClientIp(request: NextRequest): string {
  return request.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers?.get?.("x-real-ip")
    ?? "unknown";
}

async function safeParseBody(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    return await request.clone().json();
  } catch {
    return null;
  }
}

function buildInsertPayload(body: Record<string, unknown>) {
  return {
    name: body.name as string,
    phone: body.phone as string,
    email: (body.email as string | undefined) || null,
    market_slug: body.market_slug as string,
    situation_slug: body.situation_slug as string,
    source: (body.source as string | undefined) || undefined,
    property_address: (body.property_address as string | undefined) || null,
    listed_with_agent: (body.listed_with_agent as string | undefined) || null,    
    property_age: (body.property_age as string | undefined) || null,              
    timeline_to_sell: (body.timeline_to_sell as string | undefined) || null, 
    page_path: (body.page_path as string | undefined) || null,
    utm_source: (body.utm_source as string | undefined) || null,
    utm_medium: (body.utm_medium as string | undefined) || null,
    utm_campaign: (body.utm_campaign as string | undefined) || null,
    utm_content: (body.utm_content as string | undefined) || null,
    utm_term: (body.utm_term as string | undefined) || null,
    gclid: (body.gclid as string | undefined) || null,
    fbclid: (body.fbclid as string | undefined) || null,
    msclkid: (body.msclkid as string | undefined) || null,
    consent_transactional: (body.consent_transactional as boolean | undefined) ?? false,
    consent_promotional: (body.consent_promotional as boolean | undefined) ?? false,
  };
}

export async function POST(request: NextRequest) {
  const start = performance.now();

  try {
    const ip = getClientIp(request);

    // --- Rate limiting ---
    const rl = await rateLimit("leads/submit", ip, { max: 5, windowSeconds: 60 });
    if (!rl.success) {
      console.warn(`${TAG} Rate limit hit`, { ip, reset: rl.reset });
      const body = await safeParseBody(request);
      await logLeadError({
        name: body?.name as string | undefined || null,
        phone: body?.phone as string | undefined || null,
        email: body?.email as string | undefined || null,
        market_slug: body?.market_slug as string | undefined || null,
        situation_slug: body?.situation_slug as string | undefined || null,
        source: body?.source as string | undefined || null,
        property_address: body?.property_address as string | undefined || null,
        error_code: "429",
        error_message: "Rate limited — too many requests",
        error_details: `IP: ${ip}, endpoint: leads/submit`,
        payload: body as unknown as Json | null,
      });
      const resetTime = new Date(rl.reset).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      await notifyRateLimit(ip, body || {}, resetTime);
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rl.reset),
          },
        }
      );
    }

    // --- Body parsing ---
    const body = await request.json();
    const { recaptchaToken, idempotencyKey, ...leadData } = body;

    if (!leadData.name || !leadData.phone) {
      return NextResponse.json({ error: "Missing required fields: name, phone" }, { status: 400 });
    }

    const trimmedName = leadData.name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return NextResponse.json({ error: "Name must be 2-100 characters" }, { status: 400 });
    }
    if (leadData.phone && !validatePhone(leadData.phone as string)) {
      return NextResponse.json({ error: "Invalid phone format" }, { status: 400 });
    }

    const trafficSource = getTrafficSourceLabel(leadData);

    // --- Idempotency check ---
    if (idempotencyKey) {
      const existing = await checkIdempotencyKey(idempotencyKey as string);
      if (existing) {
        console.log(`${TAG} Idempotency hit for key ${idempotencyKey}`);
        return NextResponse.json(existing.response_body, { status: existing.response_status });
      }
    }

    // --- reCAPTCHA ---
    if (!RECAPTCHA_SECRET_KEY) {
      console.warn(`${TAG} RECAPTCHA_SECRET_KEY not configured — skipping verification`);
    } else if (!recaptchaToken) {
      return NextResponse.json({ error: "Missing reCAPTCHA token" }, { status: 400 });
    } else {
      const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret: RECAPTCHA_SECRET_KEY, response: recaptchaToken as string }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success || verifyData.score < MIN_RECAPTCHA_SCORE) {
        console.warn(`${TAG} reCAPTCHA failed:`, { success: verifyData.success, score: verifyData.score, errorCodes: verifyData["error-codes"] });
        return NextResponse.json({ error: "reCAPTCHA verification failed" }, { status: 400 });
      }
      console.log(`${TAG} reCAPTCHA passed — score: ${verifyData.score}`);
    }

    // --- Step 1: Supabase ---
    const insertPayload = buildInsertPayload(leadData);
    let dbResult: { success: boolean; duplicate: boolean };
    let dbDuplicate = false;

    try {
      dbResult = await insertLead(insertPayload);
      if (dbResult.duplicate) {
        dbDuplicate = true;
        console.log(`${TAG} Duplicate phone detected — continuing to GHL sync`);
      }
    } catch (dbError: any) {
      console.error(`${TAG} DB insert failed:`, { code: dbError.code, message: dbError.message });
      await logLeadError({
        name: leadData.name as string | undefined || null,
        phone: leadData.phone as string | undefined || null,
        email: leadData.email as string | undefined || null,
        market_slug: leadData.market_slug as string | undefined || null,
        situation_slug: leadData.situation_slug as string | undefined || null,
        source: leadData.source as string | undefined || null,
        property_address: leadData.property_address as string | undefined || null,
        error_code: dbError.code,
        error_message: dbError.message,
        error_details: dbError.details || null,
        payload: leadData as unknown as Json | null,
      });
      await notifyLeadError("Lead Submission Failed — DB Error", leadData, trafficSource, [
        `• Code: ${dbError.code}`,
        `• Message: ${dbError.message}`,
      ]);
      dbResult = { success: false, duplicate: false };
    }

    // --- Step 2: GHL ---
    const ghlKey = GHL_API_KEY;
    const ghlLocation = GHL_LOCATION_ID;
    const ghlConfigured = ghlKey && ghlKey !== "your_ghl_api_key_here" && ghlLocation && ghlLocation !== "your_ghl_location_id_here";

    let ghlResult: { success: boolean };
    if (ghlConfigured) {
      ghlResult = await syncLeadToGhl(leadData, {
        apiKey: ghlKey!,
        locationId: ghlLocation!,
        pipelineId: GHL_PIPELINE_ID,
        pipelineStageId: GHL_PIPELINE_STAGE_ID,
      }, trafficSource);
    } else {
      ghlResult = { success: true };
      console.warn(`${TAG} GHL not configured — skipping contact creation`);
    }

    // --- Step 3: Response ---
    const elapsed = (performance.now() - start).toFixed(0);
    let responseStatus = 200;
    let responseBody: Record<string, unknown>;

    if (dbResult.success && ghlResult.success) {
      console.log(`${TAG} ✔ Lead submitted in ${elapsed}ms`);
      await notifyLeadCaptured(leadData, trafficSource, "Synced");
      responseBody = { success: true };
    } else if (!dbResult.success && !ghlResult.success) {
      console.error(`${TAG} Both DB and GHL failed after ${elapsed}ms`);
      responseStatus = 500;
      responseBody = { error: "Failed to save lead" };
    } else {
      const warnings: string[] = [];
      if (!dbResult.success) warnings.push("Database unavailable, lead saved to GHL only");
      if (!ghlResult.success) warnings.push("GHL sync failed");
      console.warn(`${TAG} Partial success after ${elapsed}ms:`, warnings.join(", "));
      await notifyLeadPartial(leadData, trafficSource, ghlResult.success);
      responseBody = { success: true, warnings };
    }

    if (responseBody.success) {
      responseBody.duplicate = dbDuplicate || false;
    }

    if (idempotencyKey) {
      storeIdempotencyKey(idempotencyKey as string, responseStatus, responseBody);
    }

    return NextResponse.json(responseBody, { status: responseStatus });
  } catch (error) {
    const elapsed = (performance.now() - start).toFixed(0);
    console.error(`${TAG} Unexpected error after ${elapsed}ms:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
