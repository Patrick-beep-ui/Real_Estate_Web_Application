/// <reference types="jest" />

import { validateAddressShape } from "@/lib/shared/address";

describe("validateAddressShape", () => {
  // The gate only rejects the unambiguously incomplete — no street at all,
  // no house number, or no state/ZIP anywhere in the string. It deliberately
  // does NOT require a recognized street-suffix word or a city in an exact
  // token position anymore (see the "loosened" tests below) — Google's
  // Geocoding API is the authority on whether an address is real; this is
  // just a cheap pre-filter for obvious junk.
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

  // Loosened on purpose: no required street-suffix word, no required city
  // in a specific token position. A prior version of this check rejected
  // both of these; Google's geocode call is what actually decides whether
  // they're complete enough to be real addresses.
  it.each([
    "6204 Madison Avenue, CA 90001", // no explicit city
    "6204 Madison, Los Angeles, CA 90001", // no street-suffix word
  ])("accepts an address the strict USPS-suffix gate used to reject: %s", (address) => {
    expect(validateAddressShape(address)).toBe(true);
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

  it("accepts a hyphenated city name", () => {
    expect(validateAddressShape("123 Main St, Winston-Salem, NC 27101")).toBe(true);
  });

  it("accepts an address with a trailing country name", () => {
    expect(validateAddressShape("123 Main St, Tampa, FL 33612, USA")).toBe(true);
  });

  it("accepts a ZIP+4", () => {
    expect(validateAddressShape("123 Main St, Tampa, FL 33612-1234")).toBe(true);
  });
});


/**

Strict US-address format check — no network. This is the strict gate for typed

/// <reference types="jest" />

import { validateAddressShape } from "@/lib/shared/address";

describe("validateAddressShape", () => {
  it.each([
    "6204 Madison Avenue",
    "1611 Easthaven Dr",
    "6204 Madison Avenue, Los Angeles, CA",
    "6204 Madison Avenue, CA 90001",
    "Madison Avenue, Los Angeles, CA 90001",
    "6204 Madison, Los Angeles, CA 90001",
  ])("rejects incomplete address %s", (address) => {
    expect(validateAddressShape(address)).toBe(false);
  });

  it("accepts a complete US street address", () => {
    expect(validateAddressShape("6204 Madison Avenue, Los Angeles, CA 90001")).toBe(true);
  });

  // Regression: a 5-digit house number (common in CA) was matching the ZIP
  // regex before the real ZIP did, so `beforeZip` came back empty and the
  // state check failed — silently rejecting valid, complete addresses.
  it.each([
    "19075 Oceanport Lane, Huntington Beach, CA 92648",
    "73951 White Sands Drive, Thousand Palms, CA 92276",
    "12345 Ventura Blvd, Los Angeles, CA 90001",
  ])("accepts a complete address with a 5-digit house number: %s", (address) => {
    expect(validateAddressShape(address)).toBe(true);
  });

  // Regression: the street-suffix whitelist only covered ~20 common words,
  // so a real street type not on it (e.g. "Common", used by CA master-planned
  // communities like Temecula/Murrieta) was treated as an incomplete address.
  it.each([
    "43126 Lancashire Common, Temecula, CA 92592",
    "100 Windsor Commons, Temecula, CA 92591",
    "500 Legacy Crossing, Rancho Cucamonga, CA 91730",
    "200 Cobblestone Village, Corona, CA 92880",
  ])("accepts a complete address with an uncommon street suffix: %s", (address) => {
    expect(validateAddressShape(address)).toBe(true);
  });
});


 */