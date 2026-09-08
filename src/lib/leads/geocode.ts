/**
 * Server-side Google Geocoding API client for address verification.
 *
 * The browser's Places Autocomplete script is referer-restricted and can be
 * blocked entirely (Meta in-app browser, ad blockers), so the server needs its
 * own authoritative verification that doesn't depend on which browser the
 * visitor is using. The Geocoding API key (GOOGLE_MAPS_SERVER_KEY) is only
 * ever resolved here, at call time, so tests can set/override it per-suite.
 */

const TAG = "[TBH:leads:geocode]";

export type GeocodeResult = { ok: boolean; error?: string };

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