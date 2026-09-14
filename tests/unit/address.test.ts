/// <reference types="jest" />

import { validateAddressShape } from "@/lib/shared/address";

describe("validateAddressShape", () => {
  // The gate requires street, city, state, and ZIP to ALL be present as
  // separate, non-empty pieces. It rejects the unambiguously incomplete —
  // no street at all, no house number, no state/ZIP, or (see below) a
  // dropped city — without policing the exact spelling/grammar of any one
  // piece. Google's Geocoding API is the authority on whether an address is
  // real; this is just a cheap pre-filter for obvious junk.
  it.each([
    "6204 Madison Avenue",
    "1611 Easthaven Dr",
    "6204 Madison Avenue, Los Angeles, CA",
    "Madison Avenue, Los Angeles, CA 90001",
    "Tampa, FL 33612",
    "123 Main St, Tampa, FL",
    "asdf asdf",
    "12345",
    "",
  ])("rejects incomplete address %s", (address) => {
    expect(validateAddressShape(address)).toBe(false);
  });

  it("accepts a complete US street address", () => {
    expect(validateAddressShape("6204 Madison Avenue, Los Angeles, CA 90001")).toBe(true);
  });

  // Regression: a real lead's city was dropped in submission ("9581
  // Fontainebleau Boulevard, FL 33172" — the actual address was "...,
  // Miami, FL 33172") and the shape gate let it through because it only
  // checked for "enough words," not a real, separate city. City is now a
  // hard requirement.
  it("rejects an address with a dropped city (comma present, but empty)", () => {
    expect(validateAddressShape("9581 Fontainebleau Boulevard, FL 33172")).toBe(false);
    expect(validateAddressShape("6204 Madison Avenue, CA 90001")).toBe(false);
  });

  it("accepts the same address once the city is present", () => {
    expect(validateAddressShape("9581 Fontainebleau Boulevard, Miami, FL 33172")).toBe(true);
  });

  it("accepts city and state separated by a space instead of a comma", () => {
    // "123 Main St, Tampa FL 33612" — the comma before ZIP/state is simply
    // missing, not the city. Must not mistake "Tampa" for part of the state.
    expect(validateAddressShape("123 Main St, Tampa FL 33612")).toBe(true);
  });

  it("accepts an extra comma-segment (e.g. a unit/apt) before the city", () => {
    expect(validateAddressShape("9581 Fontainebleau Boulevard, Apt 4, Miami, FL 33172")).toBe(true);
  });

  // No street-suffix word required, no fixed token position for city — a
  // prior version of this check rejected both of these.
  it("accepts an address with no street-suffix word, as long as the city is present", () => {
    expect(validateAddressShape("6204 Madison, Los Angeles, CA 90001")).toBe(true);
  });

  // Regression: a 5-digit house number (common in CA) was matching the ZIP
  // regex before the real ZIP did, so the state check failed — silently
  // rejecting valid, complete addresses.
  it.each([
    "19075 Oceanport Lane, Huntington Beach, CA 92648",
    "73951 White Sands Drive, Thousand Palms, CA 92276",
    "12345 Ventura Blvd, Los Angeles, CA 90001",
  ])("accepts a complete address with a 5-digit house number: %s", (address) => {
    expect(validateAddressShape(address)).toBe(true);
  });

  // Regression: a hand-picked street-suffix whitelist only covered ~20
  // common words, so a real street type not on it (e.g. "Common", used by
  // CA master-planned communities like Temecula/Murrieta) was treated as an
  // incomplete address. The gate no longer checks suffix vocabulary at all.
  it.each([
    "43126 Lancashire Common, Temecula, CA 92592",
    "100 Windsor Commons, Temecula, CA 92591",
    "500 Legacy Crossing, Rancho Cucamonga, CA 91730",
    "200 Cobblestone Village, Corona, CA 92880",
  ])("accepts a complete address with an uncommon street suffix: %s", (address) => {
    expect(validateAddressShape(address)).toBe(true);
  });

  // Hyphenated house numbers are the standard USPS format in Queens, NY and
  // Hawaii, not a formatting error.
  it.each([
    "123-45 Northern Blvd, Flushing, NY 11354",
    "84-1234 Farrington Hwy, Waianae, HI 96792",
  ])("accepts a hyphenated house number: %s", (address) => {
    expect(validateAddressShape(address)).toBe(true);
  });

  // Manually-typed fallback input (forced by Meta's in-app browser blocking
  // the autocomplete script) may spell the state out instead of abbreviating it.
  it.each([
    "123 Main St, Tampa, Florida 33612",
    "123 Main St, Albany, New York 12207", // two-word state name
  ])("accepts a full state name instead of the 2-letter code: %s", (address) => {
    expect(validateAddressShape(address)).toBe(true);
  });

  it("rejects a fake/invalid state code", () => {
    expect(validateAddressShape("123 Main St, Tampa, ZZ 33612")).toBe(false);
  });

  it("accepts a hyphenated city name", () => {
    expect(validateAddressShape("123 Main St, Winston-Salem, NC 27101")).toBe(true);
  });

  it("accepts an address with a trailing country name", () => {
    expect(validateAddressShape("123 Main St, Tampa, FL 33612, USA")).toBe(true);
  });

  it("accepts a ZIP+4", () => {
    expect(validateAddressShape("123 Main St, Tampa, FL 33612-1234")).toBe(true);
  });

  it("rejects a PO Box (not a valid property address)", () => {
    expect(validateAddressShape("PO Box 4521, Tampa, FL 33601")).toBe(false);
  });

  it("accepts a fully space-separated address with no commas at all", () => {
    expect(validateAddressShape("123 Main St Tampa FL 33612")).toBe(true);
  });

  it("accepts a multi-word street with no recognizable suffix word", () => {
    expect(validateAddressShape("2100 Ponce De Leon Blvd, Coral Gables, FL 33134")).toBe(true);
  });
});
