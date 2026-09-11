export const GEO_CACHE_KEY = "tbh_geo_cache";
export const GEO_CACHE_TTL = 24 * 60 * 60 * 1000;

export interface GeoCacheEntry {
  city: string | null;
  state: string | null;
  country: string | null;
  timezone: string | null;
  ts: number;
}

export function readGeoCache(): GeoCacheEntry | null {
  try {
    const raw = localStorage.getItem(GEO_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GeoCacheEntry>;
    if (typeof parsed.ts !== "number") return null;
    return {
      city: parsed.city ?? null,
      state: parsed.state ?? null,
      country: parsed.country ?? null,
      timezone: parsed.timezone ?? null,
      ts: parsed.ts,
    };
  } catch {
    return null;
  }
}

export function writeGeoCache(entry: GeoCacheEntry) {
  try {
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage unavailable — ignore
  }
}
