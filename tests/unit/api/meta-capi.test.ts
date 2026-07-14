/// <reference types="jest" />

import { createHash } from "crypto";
import { sendMetaLeadEvent } from "@/lib/leads/meta-capi";
import type { LeadData } from "@/lib/leads/types";

global.fetch = jest.fn();

const sha256 = (v: string) => createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

const lead: LeadData = {
  name: "Jane Doe",
  phone: "+18135551234",
  email: "Jane@Example.com",
  market_slug: "tampa",
  situation_slug: "divorce",
  source: "website",
  fbclid: null,
};

const ctx = {
  eventId: "evt-123",
  fbp: "fb.1.1700000000000.999",
  fbc: null as string | null,
  clientIp: "1.2.3.4",
  userAgent: "jest-agent",
  sourceUrl: "https://tarekbuyshouses.com/",
};

function firedPayload() {
  const [, init] = (global.fetch as jest.Mock).mock.calls[0];
  return JSON.parse(init.body);
}

describe("sendMetaLeadEvent()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.META_CAPI_ACCESS_TOKEN = "test-token";
    process.env.NEXT_PUBLIC_META_PIXEL_ID = "111222333";
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ events_received: 1 }),
    });
  });

  it("fires a Lead event with the browser's event_id and hashed PII", async () => {
    const result = await sendMetaLeadEvent(lead, ctx);

    expect(result.success).toBe(true);
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("/111222333/events");
    expect(url).toContain("access_token=test-token");

    const event = firedPayload().data[0];
    expect(event.event_name).toBe("Lead");
    expect(event.event_id).toBe("evt-123");
    expect(event.action_source).toBe("website");
    expect(event.event_source_url).toBe("https://tarekbuyshouses.com/");
    expect(event.user_data.em).toEqual([sha256("jane@example.com")]);
    expect(event.user_data.ph).toEqual([sha256("18135551234")]); // digits only, no +
    expect(event.user_data.fn).toEqual([sha256("jane")]);
    expect(event.user_data.ln).toEqual([sha256("doe")]);
    expect(event.user_data.fbp).toBe(ctx.fbp); // cookies are not hashed
    expect(event.user_data.client_ip_address).toBe("1.2.3.4");
    expect(event.user_data.client_user_agent).toBe("jest-agent");
  });

  it("builds fbc from fbclid when the _fbc cookie is absent", async () => {
    await sendMetaLeadEvent({ ...lead, fbclid: "abc123" }, ctx);
    const { fbc } = firedPayload().data[0].user_data;
    expect(fbc).toMatch(/^fb\.1\.\d+\.abc123$/);
  });

  it("prefers the _fbc cookie over a rebuilt fbclid value", async () => {
    await sendMetaLeadEvent({ ...lead, fbclid: "abc123" }, { ...ctx, fbc: "fb.1.170.xyz" });
    expect(firedPayload().data[0].user_data.fbc).toBe("fb.1.170.xyz");
  });

  it("omits empty fields instead of hashing empty strings", async () => {
    await sendMetaLeadEvent({ ...lead, email: undefined, name: "Cher" }, ctx);
    const ud = firedPayload().data[0].user_data;
    expect(ud.em).toBeUndefined();
    expect(ud.fn).toEqual([sha256("cher")]);
    expect(ud.ln).toBeUndefined();
  });

  it("skips without calling Meta when the token is not configured", async () => {
    delete process.env.META_CAPI_ACCESS_TOKEN;
    const result = await sendMetaLeadEvent(lead, ctx);
    expect(result.success).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns failure instead of throwing when the network call fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("boom"));
    await expect(sendMetaLeadEvent(lead, ctx)).resolves.toMatchObject({ success: false });
  });

  it("returns failure when Meta rejects the event", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: "bad token" } }),
    });
    const result = await sendMetaLeadEvent(lead, ctx);
    expect(result.success).toBe(false);
    expect(result.error).toContain("bad token");
  });
});
