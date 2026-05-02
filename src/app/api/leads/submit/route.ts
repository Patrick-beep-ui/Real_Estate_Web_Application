import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

const TAG = "[API:leads/submit]";

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const GHL_API_BASE_URL = process.env.GHL_API_BASE_URL || "https://services.leadconnectorhq.com";
const MIN_RECAPTCHA_SCORE = 0.5;

export function maskPhone(phone: string): string {
  return phone.length >= 4 ? `***${phone.slice(-4)}` : "****";
}

export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  return at > 0 ? `***@${email.slice(at + 1)}` : "***";
}

export function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const firstSpace = trimmed.indexOf(" ");
  if (firstSpace === -1) return { firstName: trimmed, lastName: "" };
  return {
    firstName: trimmed.substring(0, firstSpace),
    lastName: trimmed.substring(firstSpace + 1).trim(),
  };
}

export async function POST(request: NextRequest) {
  const start = performance.now();

  try {
    const body = await request.json();
    const { recaptchaToken, ...leadData } = body;
    const { name, phone, email, market_slug, situation_slug, source } = leadData;

    if (!name || !phone) {
      return NextResponse.json({ error: "Missing required fields: name, phone" }, { status: 400 });
    }

    // Verify reCAPTCHA token server-side
    if (!RECAPTCHA_SECRET_KEY) {
      console.warn(`${TAG} RECAPTCHA_SECRET_KEY not configured — skipping verification`);
    } else if (!recaptchaToken) {
      console.warn(`${TAG} No reCAPTCHA token provided`);
      return NextResponse.json({ error: "Missing reCAPTCHA token" }, { status: 400 });
    } else {
      const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: RECAPTCHA_SECRET_KEY,
          response: recaptchaToken,
        }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.success || verifyData.score < MIN_RECAPTCHA_SCORE) {
        console.warn(`${TAG} reCAPTCHA failed:`, {
          success: verifyData.success,
          score: verifyData.score,
          errorCodes: verifyData["error-codes"],
        });
        return NextResponse.json({ error: "reCAPTCHA verification failed" }, { status: 400 });
      }

      console.log(`${TAG} reCAPTCHA passed — score: ${verifyData.score}`);
    }

    // Insert lead into Supabase
    console.log(`${TAG} Inserting lead`, {
      phone: maskPhone(phone),
      email: email ? maskEmail(email) : "(none)",
      market: market_slug,
      situation: situation_slug,
      source,
    });

    const { error: dbError } = await supabase.from("leads").insert(leadData);

    if (dbError) {
      const elapsed = (performance.now() - start).toFixed(0);
      console.error(`${TAG} DB insert failed after ${elapsed}ms:`, {
        code: dbError.code,
        message: dbError.message,
      });

      try {
        await supabase.from("lead_errors").insert({
          name,
          phone: maskPhone(phone),
          market_slug: market_slug || null,
          situation_slug: situation_slug || null,
          source: source || null,
          error_code: dbError.code,
          error_message: dbError.message,
          error_details: dbError.details || null,
        });
      } catch (logErr) {
        console.warn(`${TAG} Could not log DB error to lead_errors:`, logErr);
      }

      return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
    }

    // Fire GHL contact creation (non-blocking)
    if (GHL_API_KEY && GHL_API_KEY !== "your_ghl_api_key_here" && GHL_LOCATION_ID && GHL_LOCATION_ID !== "your_ghl_location_id_here") {
      const { firstName, lastName } = splitName(name);
      const { property_address, utm_source, utm_medium, utm_campaign, gclid, fbclid, msclkid } = leadData;

      const customFields: Array<{ key: string; value: string }> = [];
      if (utm_source) customFields.push({ key: "utm_source", value: utm_source });
      if (utm_medium) customFields.push({ key: "utm_medium", value: utm_medium });
      if (utm_campaign) customFields.push({ key: "utm_campaign", value: utm_campaign });
      if (gclid) customFields.push({ key: "gclid", value: gclid });
      if (fbclid) customFields.push({ key: "fbclid", value: fbclid });
      if (msclkid) customFields.push({ key: "msclkid", value: msclkid });
      if (property_address) customFields.push({ key: "property_address", value: property_address });

      const ghlPayload: Record<string, unknown> = {
        firstName,
        lastName,
        phone,
        locationId: GHL_LOCATION_ID,
        tags: [
          "website: Tarek Buys Houses",
          `source:${source || "unknown"}`,
          `market:${market_slug || "unknown"}`,
          `situation:${situation_slug || "unknown"}`,
          "lead",
        ],
      };
      if (email) ghlPayload.email = email;
      if (customFields.length > 0) ghlPayload.customFields = customFields;

      fetch(`${GHL_API_BASE_URL}/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GHL_API_KEY}`,
          Version: "2021-07-28",
        },
        body: JSON.stringify(ghlPayload),
      })
        .then(async (res) => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            console.error(`${TAG} GHL contact creation failed:`, { status: res.status, error: errData });
          } else {
            console.log(`${TAG} ✔ GHL contact created`);
          }
        })
        .catch((err) => console.error(`${TAG} GHL fetch error:`, err));
    } else {
      console.warn(`${TAG} GHL not configured — skipping contact creation`);
    }

    const elapsed = (performance.now() - start).toFixed(0);
    console.log(`${TAG} ✔ Lead submitted in ${elapsed}ms`);
    return NextResponse.json({ success: true });
  } catch (error) {
    const elapsed = (performance.now() - start).toFixed(0);
    console.error(`${TAG} Unexpected error after ${elapsed}ms:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
