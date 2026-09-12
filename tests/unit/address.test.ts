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
});
