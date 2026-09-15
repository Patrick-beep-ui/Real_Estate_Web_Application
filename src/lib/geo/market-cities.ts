/**
 * Single source of truth for mapping an ipinfo-detected city to a market slug.
 
 * The base map is DERIVED from every market's `serviceAreas` in
 * `@/lib/data/markets` at module load, so adding/renaming a market or one of
 * its service areas automatically gives it geolocation coverage — no more
 * hand-maintaining a parallel city list (which is what caused the Riverside /
 * Orange County misdetection: users fell through to the state's default
 * market because their city was never added here).

 */

import { MARKETS } from "@/lib/data/markets";

export const MARKET_CITY_OVERRIDES: Record<string, string> = {
  // ── Core market cities (not present in their own serviceAreas list) ──
  tampa: "tampa",
  orlando: "orlando",
  jacksonville: "jacksonville",
  phoenix: "phoenix",
  scottsdale: "scottsdale",
  mesa: "mesa",
  tucson: "tucson",
  flagstaff: "flagstaff",
  atlanta: "atlanta",
  dallas: "dallas",
  houston: "houston",
  charlotte: "charlotte",
  raleigh: "raleigh",
  nashville: "nashville",
  denver: "denver",
  sacramento: "sacramento",
  minneapolis: "minneapolis",
  indianapolis: "indianapolis",
  columbus: "columbus",
  fresno: "fresno",
  bakersfield: "bakersfield",

  // ── Aliases / neighborhoods ──
  "st. petersburg": "tampa",
  clearwater: "tampa",
  "fort worth": "dallas",
  "san antonio": "san-antonio",
  "las vegas": "las-vegas",
  henderson: "las-vegas",
  "salt lake city": "salt-lake-city",
  "st. paul": "minneapolis",
  durham: "raleigh",
  sedona: "flagstaff",
  "los angeles": "los-angeles",
  "san diego": "san-diego",
  "san francisco": "san-francisco",
  oakland: "san-francisco",
  "san jose": "san-jose",

  // ── Inland Empire / Coachella Valley (July 2026 fix) ──
  riverside: "san-bernardino",
  "san bernardino": "san-bernardino",
  corona: "san-bernardino",
  "moreno valley": "san-bernardino",
  perris: "san-bernardino",
  hemet: "san-bernardino",
  menifee: "san-bernardino",
  "lake elsinore": "san-bernardino",
  wildomar: "san-bernardino",
  "canyon lake": "san-bernardino",
  temecula: "san-bernardino",
  murrieta: "san-bernardino",
  beaumont: "san-bernardino",
  banning: "san-bernardino",
  calimesa: "san-bernardino",
  ontario: "san-bernardino",
  "rancho cucamonga": "san-bernardino",
  fontana: "san-bernardino",
  rialto: "san-bernardino",
  upland: "san-bernardino",
  chino: "san-bernardino",
  "chino hills": "san-bernardino",
  redlands: "san-bernardino",
  "palm springs": "san-bernardino",
  "palm desert": "san-bernardino",
  "rancho mirage": "san-bernardino",
  "indian wells": "san-bernardino",
  "la quinta": "san-bernardino",
  coachella: "san-bernardino",
  indio: "san-bernardino",
  "desert hot springs": "san-bernardino",

  // ── Orange County (July 2026 fix) ──
  anaheim: "orange-county",
  irvine: "orange-county",
  "costa mesa": "orange-county",
  "santa ana": "orange-county",
  "huntington beach": "orange-county",
  "garden grove": "orange-county",
  fullerton: "orange-county",
  "newport beach": "orange-county",
  westminster: "orange-county",
  "fountain valley": "orange-county",
  tustin: "orange-county",
  "buena park": "orange-county",
  "mission viejo": "orange-county",
  "laguna beach": "orange-county",
  "yorba linda": "orange-county",
  cypress: "orange-county",
  "aliso viejo": "orange-county",
  brea: "orange-county",
  "dana point": "orange-county",
  "la habra": "orange-county",
  "la palma": "orange-county",
  "laguna hills": "orange-county",
  "laguna niguel": "orange-county",
  "laguna woods": "orange-county",
  "lake forest": "orange-county",
  "los alamitos": "orange-county",
  orange: "orange-county",
  placentia: "orange-county",
  "rancho santa margarita": "orange-county",
  "san clemente": "orange-county",
  "san juan capistrano": "orange-county",
  "seal beach": "orange-county",
  stanton: "orange-county",
  "trabuco canyon": "orange-county",
  "villa park": "orange-county",

  // ── Cross-state conflicts, state-scoped ("city:CC") ──
  // These names are real cities in more than one market state, so a plain
  // city key would be wrong for half the visitors. The ipinfo region code
  // picks the right one.
  "smyrna:GA": "atlanta",
  "smyrna:TN": "nashville",
  "arlington:TX": "dallas",
  "arlington:FL": "jacksonville",
  "mooresville:NC": "charlotte",
  "mooresville:IN": "indianapolis",
  "franklin:TN": "nashville",
  "franklin:IN": "indianapolis",
  "lebanon:TN": "nashville",
  "lebanon:IN": "indianapolis",
  "sanford:FL": "orlando",
  "sanford:NC": "raleigh",
  "riverview:FL": "tampa",
  "riverview:AZ": "mesa",

  // ── Same-state ownership picks (AZ markets overlap) ──
  // Plain keys are intentional: within one state we always want the more
  // specific market regardless of whether the region was captured.
  chandler: "mesa",
  gilbert: "mesa",
  "queen creek": "mesa",
  maricopa: "mesa",
  "cave creek": "scottsdale",
  "fountain hills": "scottsdale",
  "paradise valley": "scottsdale",
};

/**
 * Cities that are genuine cross-state conflicts. They are resolved ONLY via
 * a state-scoped key (or the state fallback), never by a plain city key, so
 * an ipinfo response without a region can't silently route a visitor to the
 * wrong state's market.
 */
const SCOPED_ONLY_CITIES = new Set([
  "smyrna",
  "arlington",
  "mooresville",
  "franklin",
  "lebanon",
  "sanford",
  "riverview",
]);

/**
 * Build the full city -> market slug map: hand-authored overrides first,
 * then every market's service areas (never overwriting an override).
 */
export function buildCityToMarketMap(): Record<string, string> {
  const map: Record<string, string> = { ...MARKET_CITY_OVERRIDES };

  for (const market of Object.values(MARKETS)) {
    for (const area of market.serviceAreas ?? []) {
      const key = area.trim().toLowerCase();
      if (!key) continue;
      if (SCOPED_ONLY_CITIES.has(key)) continue;
      if (!(key in map)) map[key] = market.slug;
    }
  }

  return map;
}

/** Derived + overridden city -> market slug map. Read-only. */
export const CITY_TO_MARKET: Record<string, string> = buildCityToMarketMap();

/**
 * Resolve a market slug for a detected city. Prefers a state-scoped key
 * (`"city:CC"`) when a region code is available, then the plain city key.
 * Returns null when the city isn't mapped — callers should then fall back to
 * their state -> market default.
 */
export function lookupCityMarket(
  city: string | null | undefined,
  region: string | null | undefined
): string | null {
  if (!city) return null;

  const key = city.trim().toLowerCase();
  if (!key) return null;

  const regionCode = region ? region.trim().toUpperCase() : "";
  if (regionCode) {
    const scoped = CITY_TO_MARKET[`${key}:${regionCode}`];
    if (scoped) return scoped;
  }

  return CITY_TO_MARKET[key] ?? null;
}
