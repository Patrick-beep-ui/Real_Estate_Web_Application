import { trackLeadSubmission } from "@/lib/tracking/analytics";
import { hasAnalyticsConsent } from "@/components/widgets/CookieConsent";
import { maskPhone } from "@/lib/leads/helpers";
import { normalizePhone } from "@/lib/shared/phone";
import { getUtmParams, getClickIds } from "@/lib/tracking/traffic-source";
import { captureBrowserTimezone, readIpTimezoneFallback } from "@/lib/leads/timezone";
import type { LeadData } from "@/lib/leads/types";

export type { LeadData } from "@/lib/leads/types";

const TAG = "[TBH:leads]";

function getCookie(name: string): string | null {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/** Shared browser/server event ID so Meta deduplicates pixel + CAPI Lead events */
function newMetaEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `tbh-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
    timeline: data.timeline_to_sell,
    listed: data.listed_with_agent,
    age: data.property_age,
  });

  const utms = getUtmParams();
  const clickIds = getClickIds();
  // Only attach Meta CAPI fields when analytics consent exists — the server
  // fires the CAPI Lead event iff meta_event_id is present, mirroring the pixel.
  const metaEventId = hasAnalyticsConsent() ? newMetaEventId() : null;
  // Browser tz is always captured synchronously; ipinfo tz is read from the
  // geo cache populated on page mount (null if it hasn't resolved yet).
  const { tz_browser } = captureBrowserTimezone();
  const tz_ip = readIpTimezoneFallback();

  const payload = {
    name: data.name,
    phone: normalizedPhone,
    email: data.email || null,
    property_address: data.property_address || null,
    listed_with_agent: data.listed_with_agent || null,
    property_age: data.property_age || null,
    timeline_to_sell: data.timeline_to_sell || null,
    market_slug: data.market_slug,
    situation_slug: data.situation_slug,
    source: data.source,
    page_path: data.page_path || window.location.pathname,
    consent_transactional: data.consent_transactional ?? false,
    consent_promotional: data.consent_promotional ?? false,
    market_price: data.market_price ?? null,
    lowest_price: data.lowest_price ?? null,
    ...utms,
    ...clickIds,
    meta_event_id: metaEventId,
    fbp: metaEventId ? getCookie("_fbp") : null,
    fbc: metaEventId ? getCookie("_fbc") : null,
    tz_browser,
    tz_ip,
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
      eventId: metaEventId || undefined,
    });

    return true;
  } catch (err) {
    const elapsed = (performance.now() - start).toFixed(0);
    console.error(`${TAG} ✘ Network error after ${elapsed}ms:`, err);
    throw new Error("Network error — could not reach server");
  }
}
