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
  if (!tokens.some((t) => STREET_SUFFIX.test(t.replace(/\.+$/, "")))) return false;

  // 3) ZIP present (5 digits, optional +4)
  const zipIdx = trimmed.search(/\b\d{5}(?:-\d{4})?\b/);
  if (zipIdx === -1) return false;

  // 4) A valid 2-letter US state directly before the ZIP (comma optional)
  const beforeZip = trimmed.slice(0, zipIdx).trim();
  const stateMatch = beforeZip.match(/(^|[\s,]+)([A-Za-z]{2})\s*[,\s]*$/);
  if (!stateMatch || !US_STATES.has(stateMatch[2].toUpperCase())) return false;

  // 5) At least one alphabetic token (street name or city) that isn't the
  //    state or a suffix
  const hasCityOrName = tokens.some(
    (t, i) =>
      i > 0 &&
      /^[A-Za-z]{2,}$/.test(t) &&
      !US_STATES.has(t.toUpperCase()) &&
      !STREET_SUFFIX.test(t.replace(/\.+$/, ""))
  );

  return hasCityOrName;
}