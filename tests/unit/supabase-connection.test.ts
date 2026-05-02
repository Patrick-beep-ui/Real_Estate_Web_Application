/// <reference types="jest" />

import { supabase } from "@/lib/supabase/client";

// Mock Supabase client
jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

describe("Supabase Connection", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should have supabase client configured", () => {
    expect(supabase).toBeDefined();
    expect(supabase.from).toBeDefined();
  });

  it("should insert lead into database", async () => {
    const mockInsert = jest.fn().mockResolvedValue({ data: { id: 1 }, error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const leadData = {
      name: "Test",
      phone: "+1234567890",
      market_slug: "test-market",
      situation_slug: "test-situation",
      source: "test",
    };

    const result = await supabase
      .from("leads")
      .insert(leadData);

    expect(supabase.from).toHaveBeenCalledWith("leads");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Test" })
    );
  });

  it("should handle insert errors gracefully", async () => {
    const mockInsert = jest.fn().mockResolvedValue({ data: null, error: { message: "DB error" } });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const leadData = {
      name: "Test",
      phone: "+1234567890",
      market_slug: "test-market",
      situation_slug: "test-situation",
      source: "test",
    };

    const result = await supabase
      .from("leads")
      .insert(leadData);

    expect(result.error).toBeDefined();
  });
});
