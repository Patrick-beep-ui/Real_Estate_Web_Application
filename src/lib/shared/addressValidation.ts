export type AddressSource =
  | "google_selected"
  | "manual_confirmed"
  | "api_fallback"
  | "geocode_unavailable"
  | "user_override";

export interface AddressMeta {
  source?: AddressSource;
  override?: boolean;
}

/**
 * Structural shape check — no network. This is the authoritative format gate
 * (enforced server-side) that blocks the class of garbage which made the
 * original bypass possible (e.g. "21031n") while letting real street
 * addresses through. Requires:
 *   - a leading street number
 *   - at least one alphabetic street token
 *   - a street suffix / comma / punctuation / ZIP that marks a plausible address
 *
 * Note: intentionally lenient on city/state/ZIP (e.g. "123 Main St" passes),
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
  const hasStreetSuffix = /\b(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|way|court|ct|circle|cir|place|pl|highway|hwy|pike|trail|parkway|pkwy)\b/i.test(
    trimmed
  );
  const hasCommaOrDot = /,|\./.test(trimmed);
  const hasZip = /\d{5}/.test(trimmed);
  const hasStateZip = /[A-Za-z]{2}\s+\d{5}/.test(trimmed) || hasZip || hasCommaOrDot || hasStreetSuffix;

  if (!hasStateZip) return false;

  return rest.length >= 1;
}
