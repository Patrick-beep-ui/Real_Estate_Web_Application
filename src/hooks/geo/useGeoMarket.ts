import { useState, useEffect } from "react";
import { MARKETS, DEFAULT_MARKET, type MarketConfig } from "@/lib/data/markets";
import { readGeoCache, writeGeoCache, GEO_CACHE_TTL } from "@/lib/geo/ipinfo";

interface GeoState {
  market: MarketConfig | null;
  loading: boolean;
  city: string | null;
  state: string | null;
  country: string | null;
  timezone: string | null;
}

// Map state abbreviations / city names to the closest market slug
const STATE_TO_MARKET: Record<string, string> = {
  FL: "tampa",
  AZ: "phoenix",
  GA: "atlanta",
  TX: "dallas",
  NC: "charlotte",
  TN: "nashville",
  NV: "las-vegas",
  CO: "denver",
  MN: "minneapolis",
  CA: "los-angeles",
  UT: "salt-lake-city",
  IN: "indianapolis",
  OH: "columbus",
};

// ipinfo.io returns full state names, not abbreviations
const STATE_NAME_TO_CODE: Record<string, string> = {
  Florida: "FL",
  Arizona: "AZ",
  Georgia: "GA",
  Texas: "TX",
  "North Carolina": "NC",
  Tennessee: "TN",
  Nevada: "NV",
  Colorado: "CO",
  Minnesota: "MN",
  California: "CA",
  Utah: "UT",
  Indiana: "IN",
  Ohio: "OH",
};

// More specific city → market overrides
const CITY_TO_MARKET: Record<string, string> = {
  tampa: "tampa",
  "st. petersburg": "tampa",
  clearwater: "tampa",
  orlando: "orlando",
  jacksonville: "jacksonville",
  phoenix: "phoenix",
  scottsdale: "scottsdale",
  mesa: "mesa",
  tucson: "tucson",
  flagstaff: "flagstaff",
  sedona: "flagstaff",
  atlanta: "atlanta",
  dallas: "dallas",
  "fort worth": "dallas",
  houston: "houston",
  "san antonio": "san-antonio",
  charlotte: "charlotte",
  raleigh: "raleigh",
  durham: "raleigh",
  nashville: "nashville",
  "las vegas": "las-vegas",
  henderson: "las-vegas",
  denver: "denver",
  sacramento: "sacramento",
  "salt lake city": "salt-lake-city",
  minneapolis: "minneapolis",
  "st. paul": "minneapolis",
  indianapolis: "indianapolis",
  columbus: "columbus",
  "los angeles": "los-angeles",
  "san diego": "san-diego",
  "san francisco": "san-francisco",
  oakland: "san-francisco",
  "san jose": "san-jose",
  fresno: "fresno",
  bakersfield: "bakersfield",
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
};

function matchMarket(city: string | null, region: string | null): MarketConfig | null {
  if (city) {
    const slug = CITY_TO_MARKET[city.toLowerCase()];
    if (slug && MARKETS[slug]) return MARKETS[slug];
  }
  if (region) {
    const slug = STATE_TO_MARKET[region.toUpperCase()];
    if (slug && MARKETS[slug]) return MARKETS[slug];
  }
  return null;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useGeoMarket(): GeoState {
  const [state, setState] = useState<GeoState>({
    market: null,
    loading: true,
    city: null,
    state: null,
    country: null,
    timezone: null,
  });

  useEffect(() => {
    // 1. Check cache first
    const cached = readGeoCache();
    if (cached && Date.now() - cached.ts < GEO_CACHE_TTL) {
      const market = matchMarket(cached.city, cached.state) ?? DEFAULT_MARKET;
      setState({ market, loading: false, city: cached.city, state: cached.state, country: cached.country, timezone: cached.timezone });
      return;
    }

    // 2. Cache miss or expired — fetch fresh data
    const controller = new AbortController();

    fetch("https://ipinfo.io/json", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const city = data.city || null;
        const regionName = data.region || null;
        const region = regionName ? STATE_NAME_TO_CODE[regionName] || regionName : null;
        const country = typeof data.country === "string" && /^[a-z]{2}$/i.test(data.country)
          ? data.country.toUpperCase()
          : null;
        const timezone = data.timezone || null;
        const market = matchMarket(city, region) ?? DEFAULT_MARKET;
        console.log("[useGeoMarket] ipinfo response:", { city, regionName, region, country, timezone, market: market?.slug ?? null, raw: data });
        writeGeoCache({ city, state: region, country, timezone, ts: Date.now() });
        setState({ market, loading: false, city, state: region, country, timezone });
      })
      .catch(() => {
        // API failed — fall back to stale cache if available
        if (cached) {
          const market = matchMarket(cached.city, cached.state) ?? DEFAULT_MARKET;
          setState({ market, loading: false, city: cached.city, state: cached.state, country: cached.country, timezone: cached.timezone });
        } else {
          setState({ market: DEFAULT_MARKET, loading: false, city: null, state: null, country: null, timezone: null });
        }
      });

    return () => controller.abort();
  }, []);

  return state;
}
