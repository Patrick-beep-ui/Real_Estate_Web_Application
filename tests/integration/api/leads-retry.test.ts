/// <reference types="jest" />

import { POST } from "@/app/api/leads/retry/route";
import { supabase } from "@/lib/supabase/client";

describe("API /api/leads/retry", () => {
  it("retains the detected seller state for Supabase and GHL retries", async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === "leads") return { insert };
      if (table === "lead_errors") return { update };
      return {};
    });
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url.includes("leadconnectorhq")) {
        return { ok: true, json: async () => ({ contact: { id: "ghl-123" } }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    const response = await POST({
      json: async () => ({
        errorRecord: {
          id: "error-1",
          payload: {
            name: "Jane Smith",
            phone: "+15551234567",
            market_slug: "tampa",
            situation_slug: "divorce",
            source: "hero_form",
            seller_state: "FL",
          },
        },
      }),
    } as any);

    expect(response.status).toBe(200);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ seller_state: "FL" }));

    const ghlCall = (global.fetch as jest.Mock).mock.calls.find(
      (call) => typeof call[0] === "string" && call[0].endsWith("/contacts")
    );
    const ghlPayload = JSON.parse(ghlCall[1].body);
    expect(ghlPayload.customFields).toEqual(expect.arrayContaining([
      { key: "seller_location_state", value: "FL" },
    ]));
  });
});
