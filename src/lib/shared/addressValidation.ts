export type AddressSource =
  | "google_selected"
  | "manual_confirmed"
  | "api_fallback"
  | "geocode_unavailable"
  | "user_override";

export interface AddressMeta {
  source?: AddressSource;
  override?: boolean;
  unverified?: boolean;
}

export type VerifyResult =
  | { status: "verified"; normalized: string }
  | { status: "unverifiable" }
  | { status: "service_unavailable" };

/**
 * Structural shape check — no network. Blocks the class of garbage that made
 * the original bug possible (e.g. "21031n") while letting real street
 * addresses through. Requires:
 *   - a leading street number
 *   - at least one alphabetic street token
 *   - a city, or a state/ZIP component
 */
export function validateAddressShape(addr: string): boolean {
  const trimmed = (addr || "").trim();
  if (trimmed.length < 5) return false;

  const tokens = trimmed.split(/[\s,]+/).filter(Boolean);
  if (tokens.length < 2) return false;

  const first = tokens[0];
  if (!/^\d+[A-Za-z]?$/.test(first)) return false;

  const hasAlphaToken = tokens.some((t) => /[A-Za-z]/.test(t));
  if (!hasAlphaToken) return false;

  const rest = tokens.slice(1);
  const hasCity = /\b(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|way|court|ct|circle|cir|place|pl|highway|hwy|pike|trail|parkway|pkwy)\b/i.test(
    trimmed
  );
  const hasPlace = /\d{5}/.test(trimmed) || /,|\./.test(trimmed);
  const hasStateZip = /[A-Za-z]{2}\s+\d{5}/.test(trimmed) || hasPlace || hasCity;

  if (!hasStateZip) return false;

  return rest.length >= 1;
}

/**
 * Client-side verification using the Google Places Geocoder (the browser Maps
 * API is already loaded by AddressAutocomplete). Accepts only street-level
 * results that carry both a street_number and a route at ROOFTOP or
 * RANGE_INTERPOLATED precision. Any inability to reach Google is treated as
 * service_unavailable so we never block a lead on our own outage.
 */
export function verifyAddress(addr: string): Promise<VerifyResult> {
  return new Promise((resolve) => {
    try {
      if (
        typeof window === "undefined" ||
        !window.google?.maps?.Geocoder
      ) {
        resolve({ status: "service_unavailable" });
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: addr, region: "us" }, (results, status) => {
        try {
          if (status !== "OK" || !results || results.length === 0) {
            if (status === "ZERO_RESULTS") {
              resolve({ status: "unverifiable" });
            } else {
              resolve({ status: "service_unavailable" });
            }
            return;
          }

          const result = results[0];
          const types = result.types || [];
          const isStreetLevel =
            types.includes("street_address") ||
            types.includes("premise") ||
            types.includes("subpremise") ||
            types.includes("address");

          const components = result.address_components || [];
          const hasStreetNumber = components.some((c) =>
            c.types.includes("street_number")
          );
          const hasRoute = components.some((c) => c.types.includes("route"));

          if (!isStreetLevel || !hasStreetNumber || !hasRoute) {
            resolve({ status: "unverifiable" });
            return;
          }

          const normalized = result.formatted_address || addr.trim();
          resolve({ status: "verified", normalized });
        } catch {
          resolve({ status: "service_unavailable" });
        }
      });
    } catch {
      resolve({ status: "service_unavailable" });
    }
  });
}
