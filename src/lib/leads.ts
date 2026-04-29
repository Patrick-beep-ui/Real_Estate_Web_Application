import { trackLeadSubmission } from "@/lib/analytics";

const TAG = "[TBH:leads]";

function maskPhone(phone: string): string {
  return phone.length >= 4 ? `***${phone.slice(-4)}` : "****";
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

export async function submitLead(data: LeadData, recaptchaToken?: string) {
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
    recaptchaToken,
  };

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
}
