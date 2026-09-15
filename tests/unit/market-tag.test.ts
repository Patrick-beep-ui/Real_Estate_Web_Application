/// <reference types="jest" />

import { resolveSellerLocationTag, resolveMarketDisplayTag, resolveSellerLocationLabel } from "@/lib/leads/market-tag";

describe("resolveSellerLocationTag", () => {
  it("returns the state for US leads", () => {
    expect(resolveSellerLocationTag("FL", "US")).toBe("FL");
  });

  it("returns unknown when no seller location data is present", () => {
    expect(resolveSellerLocationTag(null, null)).toBe("unknown");
    expect(resolveSellerLocationTag("", undefined)).toBe("unknown");
  });

  it("returns the full country name for non-bucketed non-US countries", () => {
    expect(resolveSellerLocationTag(null, "CA")).toBe("Canada");
    expect(resolveSellerLocationTag("ON", "CA")).toBe("Canada");
    expect(resolveSellerLocationTag(null, "MX")).toBe("Mexico");
  });

  it("returns the region label for Central America", () => {
    expect(resolveSellerLocationTag(null, "NI")).toBe("Central America");
    expect(resolveSellerLocationTag("MN", "NI")).toBe("Central America");
  });

  it("returns the region label for South America", () => {
    expect(resolveSellerLocationTag(null, "AR")).toBe("South America");
  });

  it("returns the region label for Asia", () => {
    expect(resolveSellerLocationTag(null, "JP")).toBe("Asia");
  });

  it("is source-independent — same output for any source", () => {
    // The resolver never reads `source` or `market_slug`: the same inputs
    // resolve identically for homepage and landing leads alike.
    const withCountry = resolveSellerLocationTag("MN", "NI");
    const withState = resolveSellerLocationTag("FL", "US");
    expect(withCountry).toBe("Central America");
    expect(withState).toBe("FL");
  });

  it("never falls back to a market slug", () => {
    // A lead with a country but no state resolves to the country/region, and a
    // lead with no location data resolves to "unknown" — never to a slug.
    expect(resolveSellerLocationTag(null, "CA")).not.toMatch(/tampa|los-angeles|california/);
    expect(resolveSellerLocationTag(null, null)).toBe("unknown");
  });
});

describe("resolveMarketDisplayTag — property-address driven market detection", () => {
  it("resolves a market from the property address and displays its human name", () => {
    expect(resolveMarketDisplayTag("123 Main St, Tampa, FL 33612")).toBe("Tampa Bay");
    expect(resolveMarketDisplayTag("456 Sunset Blvd, Los Angeles, CA 90028")).toBe("Los Angeles");
  });

  it("resolves service-area cities (including aliases) to their market", () => {
    expect(resolveMarketDisplayTag("1 Beach Blvd, Clearwater, FL")).toBe("Tampa Bay");
    expect(resolveMarketDisplayTag("800 Sunset Way, Henderson, NV 89002")).toBe("Las Vegas");
  });

  it("disambiguates cross-state cities with the address state", () => {
    expect(resolveMarketDisplayTag("2200 Buford Hwy, Smyrna, GA 30080")).toBe("Atlanta Metro");
    expect(resolveMarketDisplayTag("3 Sam Ridley Pkwy, Smyrna, TN 37167")).toBe("Nashville Metro");
  });

  it("normalizes full state names for lookups", () => {
    expect(resolveMarketDisplayTag("2200 Buford Hwy, Smyrna, Georgia 30080")).toBe("Atlanta Metro");
  });

  it("falls back to the direct state when the property is outside all markets", () => {
    expect(resolveMarketDisplayTag("789 K St, Wichita, KS 67201")).toBe("KS");
    expect(resolveMarketDisplayTag("207 W Main St, Boise, ID 83702")).toBe("ID");
  });

  it("returns null when no address or no city/state can be parsed", () => {
    expect(resolveMarketDisplayTag(null)).toBeNull();
    expect(resolveMarketDisplayTag("")).toBeNull();
    expect(resolveMarketDisplayTag(undefined)).toBeNull();
    expect(resolveMarketDisplayTag("123 Main St")).toBeNull();
  });
});

describe("resolveSellerLocationLabel — unchanged homepage-only combination", () => {
  it("returns just the state for non-homepage sources", () => {
    expect(resolveSellerLocationLabel("FL", "US", "landing-california")).toBe("FL");
  });

  it("combines state and country for non-US homepage leads", () => {
    expect(resolveSellerLocationLabel("MN", "NI", "homepage")).toBe("MN / Nicaragua");
  });
});