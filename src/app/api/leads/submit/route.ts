import { NextRequest, NextResponse } from "next/server";
import { getTrafficSourceLabel } from "@/lib/traffic-source";
import { rateLimit } from "@/lib/rate-limit";
import { insertLead, logLeadError, checkIdempotencyKey, storeIdempotencyKey } from "@/lib/leads/supabase";
import { syncLeadToGhl } from "@/lib/leads/ghl";
import { validatePhone, validateEmail, buildErrorData } from "@/lib/leads/helpers";
import { notifyLeadCaptured, notifyLeadPartial, notifyLeadError, notifyRateLimit } from "@/lib/leads/notifications";
import type { LeadData } from "@/lib/leads/types";

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

function buildInsertPayload(lead: LeadData) {
  return {
    name: lead.name,
    phone: lead.phone,
    email: lead.email || null,
    market_slug: lead.market_slug,
    situation_slug: lead.situation_slug,
    source: lead.source || undefined,
    property_address: lead.property_address || null,
    listed_with_agent: lead.listed_with_agent || null,
    property_age: lead.property_age || null,
    timeline_to_sell: lead.timeline_to_sell || null,
    page_path: lead.page_path || null,
    utm_source: lead.utm_source || null,
    utm_medium: lead.utm_medium || null,
    utm_campaign: lead.utm_campaign || null,
    utm_content: lead.utm_content || null,
    utm_term: lead.utm_term || null,
    gclid: lead.gclid || null,
    fbclid: lead.fbclid || null,
    msclkid: lead.msclkid || null,
    consent_transactional: lead.consent_transactional ?? false,
    consent_promotional: lead.consent_promotional ?? false,
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
      await logLeadError(buildErrorData((body || {}) as Partial<LeadData>, "429", "Rate limited — too many requests", `IP: ${ip}, endpoint: leads/submit`));
      const resetTime = new Date(rl.reset).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      await notifyRateLimit(ip, (body || {}) as Partial<LeadData>, getTrafficSourceLabel(body || {}), resetTime);
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
    const body = (await request.json()) as Record<string, unknown>;
    const { recaptchaToken, idempotencyKey, ...rawLead } = body;

    if (!rawLead.name || !rawLead.phone || !rawLead.market_slug || !rawLead.situation_slug || !rawLead.source) {
      return NextResponse.json(
        { error: "Missing required fields: name, phone, market_slug, situation_slug, source" },
        { status: 400 },
      );
    }

    const leadData = rawLead as unknown as LeadData;

    if (!validatePhone(leadData.phone)) {
      return NextResponse.json({ error: "Invalid phone format" }, { status: 400 });
    }

    if (leadData.email && !validateEmail(leadData.email as string)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
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
      await logLeadError(buildErrorData(leadData, dbError.code, dbError.message, dbError.details || undefined));
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
