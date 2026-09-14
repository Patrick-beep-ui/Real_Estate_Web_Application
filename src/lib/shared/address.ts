export function parseAddress(addr: string) {
  const parts = addr.split(",").map((s) => s.trim());
  const street = parts[0] || addr;
  const city = parts[1] || "";
  let state = "";
  let zip = "";
  if (parts[2]) {
    const stateZip = parts[2].split(" ");
    zip = stateZip.pop() || "";
    state = stateZip.join(" ");
  }
  return { street, city, state, zip };
}

export type AddressSource =
  | "google_selected"
  | "server_places_selected"
  | "manual_confirmed"
  | "api_fallback"
  | "geocode_unavailable"
  | "user_override"
  | "server_geocoded";

export interface AddressMeta {
  source?: AddressSource;
  override?: boolean;
  canAdvance: boolean;
}

const US_STATES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID",
  "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS",
  "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK",
  "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV",
  "WI", "WY", "DC", "AS", "GU", "MP", "PR", "VI",
]);

const US_STATE_NAMES = new Set([
  "alabama", "alaska", "arizona", "arkansas", "california", "colorado",
  "connecticut", "delaware", "florida", "georgia", "hawaii", "idaho",
  "illinois", "indiana", "iowa", "kansas", "kentucky", "louisiana", "maine",
  "maryland", "massachusetts", "michigan", "minnesota", "mississippi",
  "missouri", "montana", "nebraska", "nevada", "new hampshire", "new jersey",
  "new mexico", "new york", "north carolina", "north dakota", "ohio",
  "oklahoma", "oregon", "pennsylvania", "rhode island", "south carolina",
  "south dakota", "tennessee", "texas", "utah", "vermont", "virginia",
  "washington", "west virginia", "wisconsin", "wyoming",
  "district of columbia", "puerto rico", "guam", "american samoa",
  "northern mariana islands", "virgin islands", "u.s. virgin islands",
]);

const STATE_ZIP_PATTERN = /\b([A-Za-z]{2,20}(?:[ \t]+[A-Za-z]{2,20})?)[.,]?[ \t]+(\d{5})(?:-\d{4})?\.?(?=[ \t,]|$)/g;

/**
 * Loose US-address completeness check — no network. This only exists to
 * reject the unambiguously incomplete ("Tampa, FL 33612" with no street,
 * "123 Main St" with nothing else) and obvious junk before spending a
 * Google Geocoding call on it. It deliberately does NOT try to validate the
 * exact grammar of a US address (required street-suffix word, city in an
 * exact token position, etc.) — Google's Geocoding API is the authority for
 * whether an address is real; this is just a cheap pre-filter, not a second
 * copy of the USPS address-format spec.
 */
export function validateAddressShape(addr: string): boolean {
  const trimmed = (addr || "").trim();
  if (trimmed.length < 6) return false;

  // 1) Leading house/unit number. Allows the hyphenated style used in
  //    Queens, NY and Hawaii ("123-45 Northern Blvd", "84-1234 Farrington
  //    Hwy") and an optional trailing unit letter ("1234B Main St…").
  if (!/^\d{1,6}(?:-\d{1,6})?[A-Za-z]?\b/.test(trimmed)) return false;

  // 2) Find every "<state> <zip>" occurrence and use the LAST one, so it's
  //    anchored on the real trailing state/ZIP regardless of what's before
  //    or after it in the string.
  let match: RegExpExecArray | null;
  let last: RegExpExecArray | null = null;
  STATE_ZIP_PATTERN.lastIndex = 0;
  while ((match = STATE_ZIP_PATTERN.exec(trimmed))) last = match;
  if (!last) return false;

  const stateText = last[1].trim();
  const isValidState =
    (/^[A-Za-z]{2}$/.test(stateText) && US_STATES.has(stateText.toUpperCase())) ||
    US_STATE_NAMES.has(stateText.toLowerCase());
  if (!isValidState) return false;

  // 3) Something between the house number and the state/ZIP — a street
  //    name at minimum. No required suffix word, no required separate
  //    city token: Google's geocode call decides whether that's enough to
  //    actually be a real, complete address.
  const beforeState = trimmed.slice(0, last.index).trim();
  const words = beforeState.split(/[\s,]+/).filter(Boolean);
  return words.length >= 2;
}
