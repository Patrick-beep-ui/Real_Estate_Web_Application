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

describe("resolveMarketDisplayTag — unchanged homepage-only behavior", () => {
  it("returns marketSlug for non-homepage sources", () => {
    expect(resolveMarketDisplayTag("landing-california", "CA", "california")).toBe("california");
  });

  it("still collapses non-US homepage countries to region buckets", () => {
    expect(resolveMarketDisplayTag("homepage", "NI", "tampa")).toBe("Central America");
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