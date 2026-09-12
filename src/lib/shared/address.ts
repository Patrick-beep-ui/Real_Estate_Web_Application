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

const STREET_SUFFIX = /^(?:st|street|ave|avenue|rd|road|blvd|boulevard|ln|lane|dr|drive|ct|court|cir|circle|pl|place|way|hwy|highway|pike|pkwy|parkway|ter|terrace|tr|trail|loop|run|cres|crescent)$/i;

/**
 * Full US-address format check — no network. This is the strict gate for
 * typed (non-Google) input: it requires a street number, street name, street
 * suffix, city, 2-letter state and ZIP so incomplete submissions ("street,
 * Tampa, FL 33612", "123 Main St") fail here. The server additionally runs a
 * Google Geocoding API call as the authority (rescues legitimate format-edge
 * cases like ZIP-less or PO Box addresses); the client uses this when Maps is
 * unavailable to block clearly-incomplete typed input. Google-selected
 * addresses bypass this on the server — they come from a real Google place.
 */
export function validateAddressShape(addr: string): boolean {
  const trimmed = (addr || "").trim();
  if (trimmed.length < 6) return false;

  const tokens = trimmed.split(/[\s,]+/).filter(Boolean);
  if (tokens.length < 3) return false;

  // 1) Leading street number (e.g. "1234B Main St…")
  if (!/^\d{1,6}[A-Za-z]?$/.test(tokens[0])) return false;

  // 2) A street-suffix token
  const streetSuffixIndex = tokens.findIndex((t) => STREET_SUFFIX.test(t.replace(/\.+$/, "")));
  if (streetSuffixIndex === -1) return false;

  // 3) ZIP must be the LAST token (5 digits, optional +4). Searching the raw
  //    string/tokens for the first 5-digit run is wrong: it matches a 5-digit
  //    house number before it ever reaches the real ZIP — very common in CA
  //    ("19075 Oceanport Ln...", "73951 White Sands Dr..."), which was
  //    silently rejecting valid, complete addresses.
  const zipTokenIndex = tokens.length - 1;
  const zipToken = tokens[zipTokenIndex].replace(/\.+$/, "");
  if (!/^\d{5}(?:-\d{4})?$/.test(zipToken)) return false;

  // 4) A valid 2-letter US state directly before the ZIP
  const stateTokenIndex = zipTokenIndex - 1;
  if (stateTokenIndex <= streetSuffixIndex) return false;
  const stateToken = tokens[stateTokenIndex];
  if (!/^[A-Za-z]{2}$/.test(stateToken) || !US_STATES.has(stateToken.toUpperCase())) return false;

  // 5) A city token must appear after the street suffix and before the state.
  //    This prevents a street name from satisfying the city requirement.
  return tokens
    .slice(streetSuffixIndex + 1, stateTokenIndex)
    .some((t) => /^[A-Za-z]{2,}$/.test(t));
}
