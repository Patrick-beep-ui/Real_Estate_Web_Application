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
