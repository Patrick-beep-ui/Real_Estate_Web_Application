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

const US_STATE_NAME_TO_CODE: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", "district of columbia": "DC",
  florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID", illinois: "IL",
  indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY", louisiana: "LA",
  maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI",
  minnesota: "MN", mississippi: "MS", missouri: "MO", montana: "MT",
  nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC",
  "north dakota": "ND", ohio: "OH", oklahoma: "OK", oregon: "OR",
  pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT",
  vermont: "VT", virginia: "VA", washington: "WA", "west virginia": "WV",
  wisconsin: "WI", wyoming: "WY", "puerto rico": "PR", guam: "GU",
  "american samoa": "AS", "northern mariana islands": "MP", "virgin islands": "VI",
  "u.s. virgin islands": "VI",
};

/**
 * Normalize a state token to its 2-letter US code when it's a real US state
 * (code or full name), or null otherwise. Used to scope city lookups that
 * depend on the address's state — non-US state/province tokens (e.g. "ON",
 * "NSW") pass through untouched at the call site.
 */
export function normalizeStateToCode(state: string | null | undefined): string | null {
  if (!state) return null;
  const trimmed = state.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  if (US_STATES.has(upper)) return upper;
  return US_STATE_NAME_TO_CODE[trimmed.toLowerCase()] ?? null;
}

// State code/name immediately followed by a ZIP. Built from an explicit
// alternation of the real ~55 state codes/names (not "any 1-2 words") so it
// can only ever match a real state — no ambiguity like a city word getting
// swallowed into the match (e.g. "Tampa FL" being mistaken for a two-word
// state name). State and ZIP are the only parts of a US address with a
// small, fixed, unambiguous vocabulary — unlike street-suffix words (USPS
// Publication 28 lists 200+ valid types: "Common", "Crossing", "Trace",
// "Village"...) there's no whack-a-mole risk in requiring these strictly.
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const STATE_TOKENS = [...US_STATES, ...US_STATE_NAMES]
  .map((s) => escapeRegex(s).replace(/\s+/g, "\\s+"))
  .sort((a, b) => b.length - a.length);
const STATE_ZIP_PATTERN = new RegExp(
  `\\b(${STATE_TOKENS.join("|")})[.,]?[ \\t]+(\\d{5})(?:-\\d{4})?\\.?(?=[ \\t,]|$)`,
  "gi"
);

/**
 * Loose US-address completeness check — no network. Requires a street
 * number, a street name, a city, a state, and a ZIP to ALL be present as
 * separate, non-empty pieces — an address missing any one of those (e.g.
 * "9581 Fontainebleau Boulevard, FL 33172" with the city dropped) is
 * rejected here rather than left for Google's Geocoding call to catch.
 * What it deliberately does NOT do is police the exact spelling/grammar of
 * any one piece — no required street-suffix word ("St"/"Ave"/...), no
 * length cap on a name, no fixed token-position parsing. That kind of
 * strictness is what previously blocked real, complete addresses (a
 * 5-digit house number mistaken for a ZIP, an uncommon-but-real suffix
 * like "Common" not being on a hand-picked list). Google's Geocoding API
 * is the authority on whether a given piece is actually a real place; this
 * is just a cheap pre-filter for the unambiguously incomplete.
 */
export function validateAddressShape(addr: string): boolean {
  const trimmed = (addr || "").trim();
  if (trimmed.length < 6) return false;

  // 1) Leading house/unit number. Allows the hyphenated style used in
  //    Queens, NY and Hawaii ("123-45 Northern Blvd", "84-1234 Farrington
  //    Hwy") and an optional trailing unit letter ("1234B Main St…").
  if (!/^\d{1,6}(?:-\d{1,6})?[A-Za-z]?\b/.test(trimmed)) return false;

  // 2) Find the LAST real "state zip" occurrence anywhere in the string, so
  //    it's anchored on the true trailing state/ZIP regardless of a 5-digit
  //    house number up front or trailing junk after it (", USA").
  let match: RegExpExecArray | null;
  let last: RegExpExecArray | null = null;
  STATE_ZIP_PATTERN.lastIndex = 0;
  while ((match = STATE_ZIP_PATTERN.exec(trimmed))) last = match;
  if (!last) return false;

  const rawBeforeState = trimmed.slice(0, last.index).replace(/\s+$/, "");

  if (rawBeforeState.endsWith(",")) {
    // The format explicitly puts a comma right before state/ZIP
    // ("..., STATE ZIP") — that slot must hold a real city. An empty one
    // here ("9581 Fontainebleau Boulevard, FL 33172") is exactly what a
    // dropped city looks like, so this is where that gets caught.
    const withoutTrailingComma = rawBeforeState.slice(0, -1).trim();
    const priorParts = withoutTrailingComma.split(",").map((p) => p.trim());
    const cityPart = priorParts[priorParts.length - 1] || "";
    if (cityPart.replace(/[^A-Za-z]/g, "").length < 2) return false;
    const streetWords = priorParts.slice(0, -1).join(" ").split(/\s+/).filter(Boolean);
    return streetWords.length >= 2; // house number + at least one street word
  }

  // No comma directly before state/ZIP, so street and city can't be told
  // apart structurally (e.g. "123 Main St, Tampa FL 33612" with the comma
  // only after the street, or plain "123 Main St Tampa FL 33612" with none
  // at all). Require house number + street word(s) + city word(s): at
  // least 3 words total before state/ZIP.
  const words = rawBeforeState.split(/[\s,]+/).filter(Boolean);
  return words.length >= 3;
}
