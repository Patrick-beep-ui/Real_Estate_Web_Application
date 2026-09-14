/**
 * ISO 3166-1 alpha-2 country code groupings used to bucket non-US homepage
 * leads into a broader region tag (Central America / South America / Asia)
 * instead of showing a raw country name for every single country, or
 * silently defaulting to the Tampa market like the US-only city/state
 * matcher does.
 
 * These lists intentionally do NOT need to be exhaustive of every country
 * on Earth — anything not covered here just falls through to the full
 * country name via Intl.DisplayNames (see resolveMarketDisplayTag in
 * lib/leads/market-tag.ts), which is exactly today's behavior. Add a code
 * here only when you want that specific country folded into a region
 * bucket instead of shown by its own name.
 */

// Central America — the 7 mainland countries between Mexico and Colombia.
export const CENTRAL_AMERICA_COUNTRIES = new Set([
  "BZ", // Belize
  "CR", // Costa Rica
  "SV", // El Salvador
  "GT", // Guatemala
  "HN", // Honduras
  "NI", // Nicaragua
  "PA", // Panama
]);

// South America — sovereign countries plus French Guiana (GF), which
// ipinfo can report as its own country code even though it's a French
// territory rather than a sovereign state.
export const SOUTH_AMERICA_COUNTRIES = new Set([
  "AR", // Argentina
  "BO", // Bolivia
  "BR", // Brazil
  "CL", // Chile
  "CO", // Colombia
  "EC", // Ecuador
  "GF", // French Guiana
  "GY", // Guyana
  "PY", // Paraguay
  "PE", // Peru
  "SR", // Suriname
  "UY", // Uruguay
  "VE", // Venezuela
]);

// Asia — A few of these (Turkey, Georgia, Armenia, Azerbaijan,
// Cyprus) are transcontinental / sometimes grouped with Europe instead —
// they're included here per UN M49; move them out if you'd rather treat
// them as Europe for this tagging.
export const ASIA_COUNTRIES = new Set([
  // Central Asia
  "KZ", "KG", "TJ", "TM", "UZ",
  // Eastern Asia
  "CN", "HK", "MO", "JP", "MN", "KP", "KR", "TW",
  // South-eastern Asia
  "BN", "KH", "ID", "LA", "MY", "MM", "PH", "SG", "TH", "TL", "VN",
  // Southern Asia
  "AF", "BD", "BT", "IN", "IR", "MV", "NP", "PK", "LK",
  // Western Asia (Middle East)
  "AM", "AZ", "BH", "CY", "GE", "IQ", "IL", "JO", "KW", "LB", "OM", "QA",
  "SA", "PS", "SY", "TR", "AE", "YE",
]);

export type RegionBucket = "central-america" | "south-america" | "asia";

export const REGION_LABELS: Record<RegionBucket, string> = {
  "central-america": "Central America",
  "south-america": "South America",
  asia: "Asia",
};

/**
 * Classify an ISO 3166-1 alpha-2 country code into a region bucket, or
 * null when it isn't covered by one of the lists above (e.g. US, Canada,
 * Mexico, or any country outside these three groupings).
 */
export function classifyCountryRegion(countryCode: string | null | undefined): RegionBucket | null {
  if (!countryCode) return null;
  const code = countryCode.toUpperCase();
  if (CENTRAL_AMERICA_COUNTRIES.has(code)) return "central-america";
  if (SOUTH_AMERICA_COUNTRIES.has(code)) return "south-america";
  if (ASIA_COUNTRIES.has(code)) return "asia";
  return null;
}
