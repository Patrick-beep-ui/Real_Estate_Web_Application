import { supabase } from "@/lib/supabase/client";
import { trackLeadSubmission } from "@/lib/analytics";

const TAG = "[TBH:leads]";

function maskPhone(phone: string): string {
  return phone.length >= 4 ? `***${phone.slice(-4)}` : "****";
}

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  return at > 0 ? `***@${email.slice(at + 1)}` : "***";
}

/** Extract UTM params from current URL */
function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  const utms = {
    utm_source: params.get("utm_source") || null,
    utm_medium: params.get("utm_medium") || null,
    utm_campaign: params.get("utm_campaign") || null,
  };
  console.log(`${TAG} UTM extraction:`, {
    utm_source: utms.utm_source || "(none)",
    utm_medium: utms.utm_medium || "(none)",
    utm_campaign: utms.utm_campaign || "(none)",
    raw_search: window.location.search || "(empty)",
  });
  return utms;
}

/** Extract ad platform click IDs from current URL */
function getClickIds() {
  const params = new URLSearchParams(window.location.search);
  const clickIds = {
    gclid: params.get("gclid") || params.get("gbraid") || params.get("wbraid") || null,
    fbclid: params.get("fbclid") || null,
    msclkid: params.get("msclkid") || null,
  };
  console.log(`${TAG} Click ID extraction:`, {
    gclid: clickIds.gclid ? "present" : "(none)",
    fbclid: clickIds.fbclid ? "present" : "(none)",
    msclkid: clickIds.msclkid ? "present" : "(none)",
  });
  return clickIds;
}

export interface LeadData {
  name: string;
  phone: string;
  email?: string;
  property_address?: string;
  market_slug: string;
  situation_slug: string;
  source: string;
  page_path?: string;
}

/** Normalize a US phone number to E.164 (+1XXXXXXXXXX) */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (phone.startsWith("+")) return phone;
  return `+${digits}`;
}

export async function submitLead(data: LeadData) {
  const start = performance.now();
  const normalizedPhone = normalizePhone(data.phone);
  console.log(`${TAG} ▶ submitLead() called`, {
    source: data.source,
    market: data.market_slug,
    situation: data.situation_slug,
    name: data.name,
    phone: maskPhone(normalizedPhone),
    hasEmail: !!data.email,
    hasAddress: !!data.property_address,
  });

  const utms = getUtmParams();
  const clickIds = getClickIds();

  const payload = {
    name: data.name,
    phone: normalizedPhone,
    email: data.email || null,
    property_address: data.property_address || null,
    market_slug: data.market_slug,
    situation_slug: data.situation_slug,
    source: data.source,
    page_path: data.page_path || window.location.pathname,
    ...utms,
    ...clickIds,
  };

  console.log(`${TAG} Inserting lead into DB...`, {
    phone: maskPhone(payload.phone),
    email: payload.email ? maskEmail(payload.email) : null,
    market_slug: payload.market_slug,
    situation_slug: payload.situation_slug,
    source: payload.source,
  });

  const { error } = await supabase.from("leads").insert(payload);

// from here i also need a way to prepare the insertion to

  if (error) {
    const elapsed = (performance.now() - start).toFixed(0);
    console.error(`${TAG} ✘ DB insert FAILED after ${elapsed}ms:`, {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    // Log to lead_errors table for admin visibility
    try {
      await supabase.from("lead_errors").insert({
        name: data.name,
        phone: maskPhone(data.phone),
        market_slug: data.market_slug,
        situation_slug: data.situation_slug,
        source: data.source,
        error_code: error.code,
        error_message: error.message,
        error_details: error.details || null,
      });
    } catch (logErr) {
      console.warn(`${TAG} Could not log error to lead_errors table`, logErr);
    }

    throw error;
  }

  const elapsed = (performance.now() - start).toFixed(0);
  console.log(`${TAG} ✔ Lead inserted successfully in ${elapsed}ms`);

  // Fire GHL contact creation (independent of Supabase)
  try {
    const ghlPayload = {
      name: data.name,
      phone: normalizedPhone,
      email: data.email || null,
      property_address: data.property_address || null,
      source: data.source,
      market_slug: data.market_slug,
      situation_slug: data.situation_slug,
      ...utms,
      ...clickIds,
    };
    // Call server-side API route 
    const ghlResponse = await fetch('/api/ghl/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ghlPayload),
    });
    if (!ghlResponse.ok) {
      const ghlError = await ghlResponse.json().catch(() => ({}));
      console.error(`${TAG} GHL contact creation failed:`, ghlError);
      // Log to lead_errors for admin visibility
      try {
        await supabase.from("lead_errors").insert({
          name: data.name,
          phone: maskPhone(data.phone),
          market_slug: data.market_slug,
          situation_slug: data.situation_slug,
          source: data.source,
          error_code: 'GHL_ERROR',
          error_message: ghlError.message || 'GHL contact creation failed',
          error_details: JSON.stringify(ghlError),
        });
      } catch (logErr) {
        console.warn(`${TAG} Could not log GHL error to lead_errors:`, logErr);
      }
    } else {
      console.log(`${TAG} ✔ GHL contact created successfully`);
    }
  } catch (ghlError) {
    console.error(`${TAG} GHL submission failed (non-critical):`, ghlError);
  }

  // Fire conversion tracking across GA4 + Meta Pixel
  console.log(`${TAG} Firing analytics trackLeadSubmission...`);
  trackLeadSubmission({
    market: data.market_slug,
    situation: data.situation_slug,
    source: data.source,
  });

  return true;
}
