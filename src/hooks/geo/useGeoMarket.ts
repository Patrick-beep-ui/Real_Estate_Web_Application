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
