import { trackLeadSubmission } from "@/lib/tracking/analytics";
import { hasAnalyticsConsent } from "@/components/widgets/CookieConsent";
import { maskPhone } from "@/lib/leads/helpers";
import { normalizePhone } from "@/lib/shared/phone";
import { getUtmParams, getClickIds } from "@/lib/tracking/traffic-source";
import { captureBrowserTimezone, readIpTimezoneFallback } from "@/lib/leads/timezone";
import type { LeadData } from "@/lib/leads/types";
import { readGeoCache } from "./geo/ipinfo";

export type { LeadData } from "@/lib/leads/types";

const TAG = "[TBH:leads]";

/** Errors the server returns for an address that could not be verified. */
const ADDRESS_ERROR_CODES = new Set(["address_not_found", "address_unverifiable"]);

/**
 * Thrown when the server rejects a lead. Carries the machine-readable `code`
 * so forms can branch (e.g. send the user back to the address step with an
 * inline message) and the human-readable `message` from the server.
 */
export class LeadSubmitError extends Error {
  code: string;
  reason?: string;

  constructor(message: string, code: string, reason?: string) {
    super(message);
    this.name = "LeadSubmitError";
    this.code = code;
    this.reason = reason;
  }
}

/** True when the error tells us the address itself was rejected. */
export function isLeadAddressError(err: unknown): boolean {
  return err instanceof LeadSubmitError && ADDRESS_ERROR_CODES.has(err.code);
}

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
  const seller_state = readGeoCache()?.state || null;

  const payload = {
    name: data.name,
    phone: normalizedPhone,
    email: data.email || null,
    property_address: data.property_address || null,
    address_source: data.address_source || null,
    address_override: data.address_override ?? null,
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
    meta_event_id: metaEventId,
    fbp: metaEventId ? getCookie("_fbp") : null,
    fbc: metaEventId ? getCookie("_fbc") : null,
    tz_browser,
    tz_ip,
    seller_state,
    recaptchaToken,
    idempotencyKey: idempotencyKey || null,
  };

  let response: globalThis.Response;
  try {
    response = await fetch("/api/leads/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    const elapsed = (performance.now() - start).toFixed(0);
    console.error(`${TAG} ✘ Network error after ${elapsed}ms:`, err);
    throw new Error("Network error — could not reach server");
  }

  if (!response.ok) {
    const elapsed = (performance.now() - start).toFixed(0);
    const errData = await response.json().catch(() => ({}));
    console.error(`${TAG} ✘ Lead submission failed after ${elapsed}ms:`, errData);
    // Address-rejection responses carry {error, error_code, message}; rethrow
    // as LeadSubmitError so forms can guide the user back to the address field.
    const code = errData.error;
    const serverMessage = errData.message || errData.error || "Lead submission failed";
    if (typeof code === "string" && ADDRESS_ERROR_CODES.has(code)) {
      throw new LeadSubmitError(serverMessage, code, errData.error_code);
    }
    throw new Error(serverMessage);
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
}
