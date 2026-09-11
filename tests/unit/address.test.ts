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
});
