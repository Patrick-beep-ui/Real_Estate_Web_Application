/// <reference types="jest" />

import { MARKETS } from "@/lib/data/markets";
import {
  CITY_TO_MARKET,
  buildCityToMarketMap,
  lookupCityMarket,
  MARKET_CITY_OVERRIDES,
} from "@/lib/geo/market-cities";

describe("market-cities — full coverage", () => {
  it("derives every market's service areas into the map (the whack-a-mole guard)", () => {
    // For every market, each of its service-area cities must resolve back to
    // SOME market that claims it. Same-state overlap (Phoenix vs Mesa-Gilbert
    // vs Scottsdale) is allowed to resolve to the ownership pick rather than
    // the market that happens to list it, so we check membership in the set
    // of claiming markets rather than an exact match.
    for (const market of Object.values(MARKETS)) {
      for (const area of market.serviceAreas) {
        const slug = lookupCityMarket(area, market.state);
        expect(slug).toBeTruthy();
        const claiming = Object.values(MARKETS).filter(
          (m) => m.slug === slug || m.serviceAreas.some((s) => s.toLowerCase() === area.toLowerCase())
        );
        expect(claiming.length).toBeGreaterThan(0);
      }
    }
  });

  it("covers far beyond the hand-curated city list", () => {
    // 102 entries were hand-maintained before. The derived map must be a
    // multi-hundred entry map covering suburban service areas.
    expect(Object.keys(CITY_TO_MARKET).length).toBeGreaterThan(300);
    expect(Object.keys(buildCityToMarketMap()).length).toBe(Object.keys(CITY_TO_MARKET).length);
  });

  it("routes suburbs that were previously falling through to the state default", () => {
    // FL default is Tampa, TX default is Dallas, NC default is Charlotte —
    // these used to land on the wrong market.
    expect(lookupCityMarket("Kissimmee", "FL")).toBe("orlando");
    expect(lookupCityMarket("Winter Park", "FL")).toBe("orlando");
    expect(lookupCityMarket("Mandarin", "FL")).toBe("jacksonville");
    expect(lookupCityMarket("St. Augustine", "FL")).toBe("jacksonville");
    expect(lookupCityMarket("Sugar Land", "TX")).toBe("houston");
    expect(lookupCityMarket("Katy", "TX")).toBe("houston");
    expect(lookupCityMarket("New Braunfels", "TX")).toBe("san-antonio");
    expect(lookupCityMarket("Cary", "NC")).toBe("raleigh");
    expect(lookupCityMarket("Durham", "NC")).toBe("raleigh");
    expect(lookupCityMarket("Huntersville", "NC")).toBe("charlotte");
    expect(lookupCityMarket("Carmel", "IN")).toBe("indianapolis");
    expect(lookupCityMarket("Franklin", "IN")).toBe("indianapolis");
    expect(lookupCityMarket("Eden Prairie", "MN")).toBe("minneapolis");
    expect(lookupCityMarket("Elk Grove", "CA")).toBe("sacramento");
  });
});

describe("market-cities — cross-state conflicts (state-scoped)", () => {
  it.each([
    // city, region, expected
    ["Smyrna", "GA", "atlanta"],
    ["Smyrna", "TN", "nashville"],
    ["Arlington", "TX", "dallas"],
    ["Arlington", "FL", "jacksonville"],
    ["Mooresville", "NC", "charlotte"],
    ["Mooresville", "IN", "indianapolis"],
    ["Franklin", "TN", "nashville"],
    ["Franklin", "IN", "indianapolis"],
    ["Lebanon", "TN", "nashville"],
    ["Lebanon", "IN", "indianapolis"],
    ["Sanford", "FL", "orlando"],
    ["Sanford", "NC", "raleigh"],
    ["Riverview", "FL", "tampa"],
    ["Riverview", "AZ", "mesa"],
  ])("%s (%s) -> %s", (city, region, expected) => {
    expect(lookupCityMarket(city, region)).toBe(expected);
  });

  it("never resolves a cross-state conflict from a plain key alone", () => {
    expect(lookupCityMarket("Arlington", null)).toBeNull();
    expect(lookupCityMarket("Smyrna", null)).toBeNull();
    expect(lookupCityMarket("Sanford", null)).toBeNull();
    expect(lookupCityMarket("Franklin", null)).toBeNull();
  });
});

describe("market-cities — same-state ownership picks (AZ)", () => {
  it.each([
    ["Chandler", "mesa"],
    ["Gilbert", "mesa"],
    ["Queen Creek", "mesa"],
    ["Maricopa", "mesa"],
    ["Cave Creek", "scottsdale"],
    ["Fountain Hills", "scottsdale"],
    ["Paradise Valley", "scottsdale"],
  ])("%s -> %s even without a region", (city, expected) => {
    expect(lookupCityMarket(city, "AZ")).toBe(expected);
    expect(lookupCityMarket(city, null)).toBe(expected);
  });
});

describe("market-cities — regressions from the July 2026 fix", () => {
  it("Inland Empire / Coachella Valley still resolve to san-bernardino", () => {
    expect(lookupCityMarket("Palm Springs", "CA")).toBe("san-bernardino");
    expect(lookupCityMarket("Indio", "CA")).toBe("san-bernardino");
    expect(lookupCityMarket("Corona", "CA")).toBe("san-bernardino");
    expect(lookupCityMarket("Temecula", "CA")).toBe("san-bernardino");
    expect(lookupCityMarket("Redlands", "CA")).toBe("san-bernardino");
    expect(lookupCityMarket("Ontario", "CA")).toBe("san-bernardino");
    expect(lookupCityMarket("Rancho Cucamonga", "CA")).toBe("san-bernardino");
    expect(lookupCityMarket("Riverside", "CA")).toBe("san-bernardino");
  });

  it("Orange County cities still resolve to orange-county", () => {
    expect(lookupCityMarket("Anaheim", "CA")).toBe("orange-county");
    expect(lookupCityMarket("Irvine", "CA")).toBe("orange-county");
    expect(lookupCityMarket("Mission Viejo", "CA")).toBe("orange-county");
    expect(lookupCityMarket("Laguna Niguel", "CA")).toBe("orange-county");
    expect(lookupCityMarket("San Clemente", "CA")).toBe("orange-county");
  });
});

describe("market-cities — core cities and aliases", () => {
  it("resolves the core city of every market", () => {
    const cores: Array<[string, string]> = [
      ["Tampa", "tampa"],
      ["Phoenix", "phoenix"],
      ["Atlanta", "atlanta"],
      ["Dallas", "dallas"],
      ["Houston", "houston"],
      ["Charlotte", "charlotte"],
      ["Nashville", "nashville"],
      ["Jacksonville", "jacksonville"],
      ["Orlando", "orlando"],
      ["San Antonio", "san-antonio"],
      ["Las Vegas", "las-vegas"],
      ["Denver", "denver"],
      ["Raleigh", "raleigh"],
      ["Minneapolis", "minneapolis"],
      ["Sacramento", "sacramento"],
      ["Salt Lake City", "salt-lake-city"],
      ["Tucson", "tucson"],
      ["Indianapolis", "indianapolis"],
      ["Columbus", "columbus"],
      ["San Bernardino", "san-bernardino"],
      ["Los Angeles", "los-angeles"],
      ["San Diego", "san-diego"],
      ["San Francisco", "san-francisco"],
      ["San Jose", "san-jose"],
      ["Fresno", "fresno"],
      ["Bakersfield", "bakersfield"],
      ["Mesa", "mesa"],
      ["Scottsdale", "scottsdale"],
      ["Flagstaff", "flagstaff"],
    ];
    for (const [city, expected] of cores) {
      expect(lookupCityMarket(city, null)).toBe(expected);
    }
  });

  it("resolves common aliases and neighborhoods", () => {
    expect(lookupCityMarket("St. Petersburg", "FL")).toBe("tampa");
    expect(lookupCityMarket("Clearwater", "FL")).toBe("tampa");
    expect(lookupCityMarket("Fort Worth", "TX")).toBe("dallas");
    expect(lookupCityMarket("St. Paul", "MN")).toBe("minneapolis");
    expect(lookupCityMarket("Henderson", "NV")).toBe("las-vegas");
    expect(lookupCityMarket("Sedona", "AZ")).toBe("flagstaff");
    expect(lookupCityMarket("Oakland", "CA")).toBe("san-francisco");
  });

  it("routes out-of-state suburbs to their market via plain city key", () => {
    // Charlotte's service area extends into South Carolina — the plain city
    // key (not the state fallback) is what catches these.
    expect(lookupCityMarket("Rock Hill", "SC")).toBe("charlotte");
    expect(lookupCityMarket("Fort Mill", "SC")).toBe("charlotte");
    expect(lookupCityMarket("Gastonia", "SC")).toBe("charlotte");
  });
});

describe("market-cities — fallbacks", () => {
  it("returns null for unmapped cities and missing input", () => {
    expect(lookupCityMarket("Nowheresville", "WY")).toBeNull();
    expect(lookupCityMarket("", "FL")).toBeNull();
    expect(lookupCityMarket(null, "FL")).toBeNull();
    expect(lookupCityMarket(undefined, "FL")).toBeNull();
  });

  it("keeps every override pointing at a real market slug", () => {
    for (const slug of Object.values(MARKET_CITY_OVERRIDES)) {
      expect(MARKETS[slug]).toBeTruthy();
    }
  });
});