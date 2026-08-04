/// <reference types="jest" />

import { submitLead } from "@/lib/leads";
import { normalizePhone } from "@/lib/phone";
import { maskPhone } from "@/lib/leads/helpers";
import { trackLeadSubmission } from "@/lib/analytics";

// Mock modules
jest.mock("@/lib/analytics", () => ({
  trackLeadSubmission: jest.fn(),
}));

jest.mock("@/lib/recaptcha", () => ({
  getRecaptchaToken: jest.fn().mockResolvedValue("fake-recaptcha-token"),
}));

// Mock fetch
global.fetch = jest.fn();

describe("leads.ts - Pure Functions", () => {
  describe("normalizePhone()", () => {
    it("normalizes 10-digit phone to E.164", () => {
      expect(normalizePhone("123-456-7890")).toBe("+11234567890");
      expect(normalizePhone("(123) 456-7890")).toBe("+11234567890");
      expect(normalizePhone("123.456.7890")).toBe("+11234567890");
      expect(normalizePhone("1234567890")).toBe("+11234567890");
    });

    it("normalizes 11-digit phone starting with 1 to E.164", () => {
      expect(normalizePhone("1-123-456-7890")).toBe("+11234567890");
      expect(normalizePhone("11234567890")).toBe("+11234567890");
    });

    it("preserves existing E.164 format", () => {
      expect(normalizePhone("+11234567890")).toBe("+11234567890");
    });

    it("handles phone with special chars", () => {
      expect(normalizePhone("(123) 456-7890")).toBe("+11234567890");
    });
  });

  describe("maskPhone()", () => {
    it("masks phone showing only last 4 digits", () => {
      expect(maskPhone("+11234567890")).toBe("***7890");
      expect(maskPhone("1234567890")).toBe("***7890");
    });

    it("returns **** for short phone numbers", () => {
      expect(maskPhone("123")).toBe("****");
      expect(maskPhone("")).toBe("****");
    });
  });
});

describe("leads.ts - submitLead()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  const leadData = {
    name: "John Smith",
    phone: "123-456-7890",
    email: "john@test.com",
    property_address: "123 Main St",
    market_slug: "tampa",
    situation_slug: "divorce",
    source: "hero_form",
    market_price: 350000,
    lowest_price: 300000,
  };

  it("submits lead successfully with normalized phone", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const result = await submitLead(leadData, "recaptcha-token");

    expect(result).toBe(true);
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.phone).toBe("+11234567890");
    expect(body.market_price).toBe(350000);
    expect(body.lowest_price).toBe(300000);
  });

  it("submits lead without email when not provided", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const dataWithoutEmail = { ...leadData };
    delete (dataWithoutEmail as any).email;
    await submitLead(dataWithoutEmail, "recaptcha-token");

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.email).toBeNull();
  });

  it("submits lead without address when not provided", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const dataWithoutAddress = { ...leadData };
    delete (dataWithoutAddress as any).property_address;
    await submitLead(dataWithoutAddress, "recaptcha-token");

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.property_address).toBeNull();
  });

  it("throws error when API returns non-OK response", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Server error" }),
    });

    await expect(submitLead(leadData, "recaptcha-token")).rejects.toThrow("Network error — could not reach server");
  });

  it("throws generic error when API response has no error message", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    await expect(submitLead(leadData, "recaptcha-token")).rejects.toThrow("Network error — could not reach server");
  });

  it("includes recaptcha token in payload", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await submitLead(leadData, "my-recaptcha-token");

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.recaptchaToken).toBe("my-recaptcha-token");
  });

  it("sends null for property question fields when not provided", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await submitLead(leadData, "recaptcha-token");

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.timeline_to_sell).toBeNull();
    expect(body.listed_with_agent).toBeNull();
    expect(body.property_age).toBeNull();
  });

  it("includes property question fields in payload when provided", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const dataWithPropertyQs = {
      ...leadData,
      timeline_to_sell: "ASAP (within 30 days)",
      listed_with_agent: "No, it's not listed",
      property_age: "50+ years",
    };

    await submitLead(dataWithPropertyQs, "recaptcha-token");

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.timeline_to_sell).toBe("ASAP (within 30 days)");
    expect(body.listed_with_agent).toBe("No, it's not listed");
    expect(body.property_age).toBe("50+ years");
  });
});
