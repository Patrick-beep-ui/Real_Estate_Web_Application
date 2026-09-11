import { NextRequest, NextResponse, after } from "next/server";
import { sendMetaLeadEvent } from "@/lib/leads/meta-capi";
import { getTrafficSourceLabel } from "@/lib/tracking/traffic-source";
import { rateLimit } from "@/lib/shared/rate-limit";
import { GHL_API_KEY, GHL_LOCATION_ID, GHL_API_BASE_URL, GHL_PIPELINE_ID, GHL_PIPELINE_STAGE_ID } from "@/lib/shared/env";
import { insertLead, logLeadError, checkIdempotencyKey, storeIdempotencyKey } from "@/lib/leads/supabase";
import { syncLeadToGhl } from "@/lib/leads/ghl";
import { validatePhone, validateEmail, buildErrorData } from "@/lib/leads/helpers";
import { validateAddressShape } from "@/lib/shared/address";
import { buildAddressBlockMessage, geocodeAddress } from "@/lib/leads/geocode";
import { notifyLeadCaptured, notifyLeadPartial, notifyLeadError, notifyRateLimit, notifyLeadAddressBlocked } from "@/lib/leads/notifications";
import type { LeadData } from "@/lib/leads/types";
import { getClientIp } from "@/lib/shared/requests";

const TAG = "[API:leads/submit]";
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const MIN_RECAPTCHA_SCORE = 0.5;

async function safeParseBody(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    return await request.clone().json();
  } catch {
    return null;
  }
}

function buildInsertPayload(
  lead: LeadData,
  addressVerified: boolean | null,
  addressSource: string | null
) {
  return {
    name: lead.name,
    phone: lead.phone,
    email: lead.email || null,
    market_slug: lead.market_slug,
    situation_slug: lead.situation_slug,
    source: lead.source || undefined,
    property_address: lead.property_address || null,
    address_verified: addressVerified,
    address_source: addressSource,
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
    gbraid: lead.gbraid || null,
    wbraid: lead.wbraid || null,
    fbclid: lead.fbclid || null,
    msclkid: lead.msclkid || null,
    tz_browser: lead.tz_browser || null,
    tz_ip: lead.tz_ip || null,
    seller_state: lead.seller_state || null,
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

    if (!rawLead.name || !rawLead.phone) {
      return NextResponse.json({ error: "Missing required fields: name, phone" }, { status: 400 });
    }

    const leadData = rawLead as unknown as LeadData;

    if (!validatePhone(leadData.phone)) {
      return NextResponse.json({ error: "Invalid phone format" }, { status: 400 });
    }

    if (leadData.email && !validateEmail(leadData.email as string)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // --- Address enforcement (authoritative, server-side) ---
    // There is no free-pass: every submitted address must pass the full-address
    // shape gate AND a real Google Geocoding API call, which
    // works regardless of the browser (Meta in-app browsers block the
    // referer-restricted Places script, but Geocoding API calls come from the
    // server). Browser provenance is diagnostic only and never bypasses these
    // checks. When verification fails, the submission is blocked with a
    // descriptive message explaining the required address format.

    const addrSource = leadData.address_source || null;
    const selectedFromGoogle = addrSource === "google_selected" || addrSource === "server_places_selected";
    let addressVerified: boolean | null = null;
    let addressSource: string | null = null;
    let addressFlagReason = "";
    let addressBlock: { error: string; message: string } | null = null;

    if (leadData.property_address) {
      if (!validateAddressShape(leadData.property_address)) {
        // Keep the existing no-match response/message for incomplete addresses.
        addressBlock = buildAddressBlockMessage(leadData.property_address, "no_match", selectedFromGoogle);
        addressFlagReason = "no_match";
      } else {
        const geo = await geocodeAddress(leadData.property_address);

        if (geo.ok) {
          addressVerified = true;

          // Preserve the UI path for diagnostics, but the server Geocoding API
          // is what establishes `address_verified`.
          addressSource = addrSource || "server_geocoded";
        } else {
          addressBlock = buildAddressBlockMessage(
            leadData.property_address,
            geo.error || "unknown",
            selectedFromGoogle
          );
          addressFlagReason = geo.error || "unknown";
        }
      }
    }

    const trafficSource = getTrafficSourceLabel(leadData);
    const tzSource = leadData.tz_browser ? "browser" : leadData.tz_ip ? "ip" : null;
    console.log(`${TAG} timezone=${leadData.tz_browser ?? leadData.tz_ip ?? "none"}${tzSource ? ` source=${tzSource}` : ""}`);

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

    // --- Address block / flag (after reCAPTCHA, so unverified bot attempts
    // can't reach the lead_errors writes or Slack) ---
    if (addressBlock) {
      await logLeadError(
        buildErrorData(leadData, "422", "ADDRESS_UNVERIFIED — blocked: " + addressFlagReason, addressFlagReason || addrSource || "manual_input")
      );
      await notifyLeadAddressBlocked(leadData, trafficSource, addressFlagReason || "unknown", addressBlock.message);
      return NextResponse.json(
        {
          error: addressBlock.error,
          error_code: addressFlagReason || "unknown",
          message: addressBlock.message,
          address: leadData.property_address,
        },
        { status: 422 }
      );
    }

    // --- Step 1: Supabase ---
    const insertPayload = buildInsertPayload(leadData, addressVerified, addressSource);
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

    let ghlResult: { success: boolean; skipped?: boolean };
    if (ghlConfigured) {
      ghlResult = await syncLeadToGhl(leadData, {
        apiKey: ghlKey!,
        locationId: ghlLocation!,
        pipelineId: GHL_PIPELINE_ID,
        pipelineStageId: GHL_PIPELINE_STAGE_ID,
      }, trafficSource);
    } else {
      ghlResult = { success: false, skipped: true };
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
    } else if (!dbResult.success && !ghlResult.success && !ghlResult.skipped) {
      console.error(`${TAG} Both DB and GHL failed after ${elapsed}ms`);
      responseStatus = 500;
      responseBody = { error: "Failed to save lead" };
    } else {
      const warnings: string[] = [];
      if (!dbResult.success) warnings.push("Database unavailable");
      if (ghlResult.skipped) warnings.push("GHL not configured");
      else if (!ghlResult.success) warnings.push("GHL sync failed");
      console.warn(`${TAG} Partial success after ${elapsed}ms:`, warnings.join(", "));
      await notifyLeadPartial(leadData, trafficSource, ghlResult.success);
      responseBody = { success: true, warnings };
    }

    if (responseBody.success) {
      responseBody.duplicate = dbDuplicate || false;
    }

    // Server-side Meta Lead event, deduplicated against the browser pixel via
    // the shared meta_event_id. Only present when the browser had analytics
    // consent. after() runs post-response, so Meta latency never delays leads.
    if (responseBody.success && leadData.meta_event_id) {
      const userAgent = request.headers.get("user-agent") || undefined;
      const origin = new URL(request.url).origin;
      const capiCtx = {
        eventId: leadData.meta_event_id,
        fbp: leadData.fbp,
        fbc: leadData.fbc,
        clientIp: ip === "unknown" ? undefined : ip,
        userAgent,
        sourceUrl: `${origin}${leadData.page_path || "/"}`,
      };
      after(() => sendMetaLeadEvent(leadData, capiCtx));
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
