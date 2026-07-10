import { trackLeadSubmission } from "@/lib/analytics";
import { maskPhone } from "@/lib/leads/helpers";
import type { LeadData } from "@/lib/leads/types";

export type { LeadData } from "@/lib/leads/types";

const TAG = "[TBH:leads]";

/** Extract UTM params from current URL */
export function getUtmParams() {  
  const params = new URLSearchParams(window.location.search);
  const utms = {
    utm_source: params.get("utm_source") || null,
    utm_medium: params.get("utm_medium") || null,
    utm_campaign: params.get("utm_campaign") || null,
    utm_content: params.get("utm_content") || null,
    utm_term: params.get("utm_term") || null,
  };
  console.log(`${TAG} UTM extraction:`, {
    utm_source: utms.utm_source || "(none)",
    utm_medium: utms.utm_medium || "(none)",
    utm_campaign: utms.utm_campaign || "(none)",
    utm_content: utms.utm_content || "(none)",
    utm_term: utms.utm_term || "(none)",
    raw_search: window.location.search || "(empty)",
  });
  return utms;
}

/** Extract ad platform click IDs from current URL */
export function getClickIds() {
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

/** Normalize a US phone number to E.164 (+1XXXXXXXXXX) */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (phone.startsWith("+")) return phone;
  return `+${digits}`;
}

export async function submitLead(data: LeadData, recaptchaToken?: string, idempotencyKey?: string) {
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
    consent_transactional: data.consent_transactional ?? false,
    consent_promotional: data.consent_promotional ?? false,
    listed_with_agent: data.listed_with_agent || null,
    property_age: data.property_age || null,
    timeline_to_sell: data.timeline_to_sell || null,
    ...utms,
    ...clickIds,
    recaptchaToken,
    idempotencyKey: idempotencyKey || null,
  };

  try {
    const response = await fetch("/api/leads/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const elapsed = (performance.now() - start).toFixed(0);
      const errData = await response.json().catch(() => ({}));
      console.error(`${TAG} ✘ Lead submission failed after ${elapsed}ms:`, errData);
      throw new Error(errData.error || "Lead submission failed");
    }

    const elapsed = (performance.now() - start).toFixed(0);
    console.log(`${TAG} ✔ Lead submitted in ${elapsed}ms`);

    // Fire conversion tracking across GA4 + Meta Pixel
    console.log(`${TAG} Firing analytics trackLeadSubmission...`);
    trackLeadSubmission({
      market: data.market_slug,
      situation: data.situation_slug,
      source: data.source,
    });

    return true;
  } catch (err) {
    const elapsed = (performance.now() - start).toFixed(0);
    console.error(`${TAG} ✘ Network error after ${elapsed}ms:`, err);
    throw new Error("Network error — could not reach server");
  }
}
