/**
 * Server-side Google Geocoding API client for address verification.
 *
 * The browser's Places Autocomplete script is referer-restricted and can be
 * blocked entirely (Meta in-app browser, ad blockers), so the server needs its
 * own authoritative verification that doesn't depend on which browser the
 * visitor is using. The Geocoding API key (GOOGLE_MAPS_SERVER_KEY) is only
 * ever resolved here, at call time, so tests can set/override it per-suite.
 */

import { PHONE } from "@/lib/shared/phone";

const TAG = "[TBH:leads:geocode]";

export type GeocodeResult = { ok: boolean; error?: string };

/**
 * Category of a failed geocode, used to pick the user-facing block message.
 * `no_match` is the only definitive "this is not a real address" signal; every
 * other reason is an infrastructure/Google-side failure.
 */
export type AddressBlockReason =
  | "no_match"
  | "timeout"
  | "network"
  | "no_key"
  | "quota_exceeded"
  | "key_denied"
  | "http_error";

const FORMAT_HINT =
  "For a cash offer we need to verify the property address, so please enter the complete street address — street number, street name, city, state, and ZIP (e.g. 123 Main St, Tampa, FL 33612) — then try again.";
const CALL_HINT = `If you're sure the address is correct, call us at ${PHONE.call}.`;

function reasonCategory(reason: string): AddressBlockReason {
  switch (reason) {
    case "no_match":
      return "no_match";
    case "timeout":
      return "timeout";
    case "network":
      return "network";
    case "no_key":
      return "no_key";
    case "quota_exceeded":
    case "over_query_limit":
      return "quota_exceeded";
    case "key_denied":
    case "request_denied":
      return "key_denied";
    default:
      return "http_error";
  }
}

/**
 * Build the descriptive message shown to the user when a typed address cannot
 * be verified server-side. Rejects the submission instead of storing lead data.
 * `error` is a stable programmatic code ("address_not_found" | "address_unverifiable");
 * `message` is the human-readable copy rendered inline under the address field.
 */
export function buildAddressBlockMessage(
  address: string,
  reason: string,
  selectedFromGoogle = false
): { error: "address_not_found" | "address_unverifiable"; message: string } {
  const quoted = `"${(address?.trim() || "your address")}"`;
  switch (reasonCategory(reason)) {
    case "no_match":
      return {
        error: "address_not_found",
        message:
          `${selectedFromGoogle ? "" : `We couldn't find ${quoted} on Google Maps. `}${FORMAT_HINT} ${CALL_HINT}`,
      };
    case "timeout":
    case "network":
      return {
        error: "address_unverifiable",
        message: `We couldn't verify ${quoted} right now. ${FORMAT_HINT} ${CALL_HINT}`,
      };
    case "quota_exceeded":
      return {
        error: "address_unverifiable",
        message:
          "We're getting a lot of submissions right now and couldn't verify your address. Please wait a few minutes, then try again.",
      };
    case "no_key":
      return {
        error: "address_unverifiable",
        message:
          "Address verification is temporarily unavailable. Please try again in a few minutes.",
      };
    case "key_denied":
    case "http_error":
      return {
        error: "address_unverifiable",
        message: `We couldn't verify ${quoted} right now. ${FORMAT_HINT} ${CALL_HINT}`,
      };
  }
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1h
const MAX_CACHE_ENTRIES = 500;
const REQUEST_TIMEOUT_MS = 4000;

const cache = new Map<string, { at: number; result: GeocodeResult }>();

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const key =
    process.env.TESTING_GOOGLE_MAPS_SERVER_KEY ||
    process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!key) {
    console.warn(`${TAG} no Google Maps server key configured — treating address as unverified`);
    return { ok: false, error: "no_key" };
  }

  const normalized = address.trim().toLowerCase().replace(/\s+/g, " ");
  const now = Date.now();
  const cached = cache.get(normalized);
  if (cached && now - cached.at < CACHE_TTL_MS) {
    return cached.result;
  }

  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address.trim())}&key=${key}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      const result: GeocodeResult = { ok: false, error: `http_${res.status}` };
      cache.set(normalized, { at: Date.now(), result });
      return result;
    }

    const data = (await res.json()) as { status?: string };
    let result: GeocodeResult;
    switch (data.status) {
      case "OK":
        result = { ok: true };
        break;
      case "ZERO_RESULTS":
        result = { ok: false, error: "no_match" };
        break;
      default:
        result = { ok: false, error: (data.status || "unknown").toLowerCase() };
        break;
    }
    cache.set(normalized, { at: Date.now(), result });
    return result;
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "AbortError";
    return { ok: false, error: timedOut ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }
}
