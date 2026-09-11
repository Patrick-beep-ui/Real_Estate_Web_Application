/// <reference types="jest" />

import { EXPORT_COLUMNS } from "@/lib/leads/export-utils";
import type { Lead } from "@/lib/leads/types";

const lead = {
  seller_state: "FL",
} as Lead;

describe("lead exports", () => {
  it("includes the detected seller state column", () => {
    const sellerStateColumn = EXPORT_COLUMNS.find(
      (column) => column.header === "Seller Location (State)"
    );

    expect(sellerStateColumn).toBeDefined();
    expect(sellerStateColumn?.accessor(lead)).toBe("FL");
  });
});
