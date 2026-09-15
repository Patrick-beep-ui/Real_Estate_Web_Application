import { useState, useEffect } from "react";
import { MARKETS, DEFAULT_MARKET, type MarketConfig } from "@/lib/data/markets";
import { readGeoCache, writeGeoCache, GEO_CACHE_TTL } from "@/lib/geo/ipinfo";
import { lookupCityMarket } from "@/lib/geo/market-cities";

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

function matchMarket(city: string | null, region: string | null): MarketConfig | null {
  const citySlug = lookupCityMarket(city, region);
  if (citySlug && MARKETS[citySlug]) return MARKETS[citySlug];

  if (region) {
    const slug = STATE_TO_MARKET[region.toUpperCase()];
    if (slug && MARKETS[slug]) return MARKETS[slug];
  }
  return null;
}

// ── Shared fetch ───────────────────────────────────────────────────────────

interface NormalizedGeo {
  city: string | null;
  region: string | null;
  country: string | null;
  timezone: string | null;
}

let geoFetchPromise: Promise<NormalizedGeo | null> | null = null;

/**
 * Fetch + normalize ipinfo data once per session. Multiple concurrent callers
 * (HomeHero, MarketsGrid, GeoWarm) share the same in-flight request instead of
 * each hitting ipinfo on a cold cache.
 */
function fetchAndNormalizeGeo(): Promise<NormalizedGeo | null> {
  if (!geoFetchPromise) {
    geoFetchPromise = fetch("https://ipinfo.io/json")
      .then((r) => r.json())
      .then((data): NormalizedGeo => {
        const regionName: string | null = data.region || null;
        const region = regionName ? STATE_NAME_TO_CODE[regionName] || regionName : null;
        const country: string | null = typeof data.country === "string" && /^[a-z]{2}$/i.test(data.country)
          ? data.country.toUpperCase()
          : null;
        const city: string | null = data.city || null;
        const timezone: string | null = data.timezone || null;
        console.log("[useGeoMarket] ipinfo response:", { city, regionName, region, country, timezone, market: matchMarket(city, region)?.slug ?? null, raw: data });
        return { city, region, country, timezone };
      })
      .catch(() => null)
      .finally(() => {
        geoFetchPromise = null;
      });
  }
  return geoFetchPromise;
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

    // 2. Cache miss or expired — fetch fresh data (deduped across callers)
    let cancelled = false;

    fetchAndNormalizeGeo().then((geo) => {
      if (cancelled) return;
      if (geo) {
        writeGeoCache({ city: geo.city, state: geo.region, country: geo.country, timezone: geo.timezone, ts: Date.now() });
        setState({ market: matchMarket(geo.city, geo.region) ?? DEFAULT_MARKET, loading: false, city: geo.city, state: geo.region, country: geo.country, timezone: geo.timezone });
        return;
      }

      // API failed — fall back to stale cache if available
      if (cached) {
        const market = matchMarket(cached.city, cached.state) ?? DEFAULT_MARKET;
        setState({ market, loading: false, city: cached.city, state: cached.state, country: cached.country, timezone: cached.timezone });
      } else {
        setState({ market: DEFAULT_MARKET, loading: false, city: null, state: null, country: null, timezone: null });
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
