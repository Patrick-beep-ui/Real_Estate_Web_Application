/// <reference types="jest" />

import { submitLead, isLeadAddressError, LeadSubmitError } from "@/lib/leads";
import { normalizePhone } from "@/lib/shared/phone";
import { maskPhone } from "@/lib/leads/helpers";
import { trackLeadSubmission } from "@/lib/tracking/analytics";
import {
  captureAttributionForClientNavigation,
  captureAttributionForDocumentEntry,
} from "@/lib/tracking/traffic-source";

// Mock modules
jest.mock("@/lib/tracking/analytics", () => ({
  trackLeadSubmission: jest.fn(),
}));

jest.mock("@/lib/tracking/recaptcha", () => ({
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
    localStorage.removeItem("tbh_attribution");
    sessionStorage.removeItem("tbh_attribution_session");
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
    expect(global.fetch).toHaveBeenCalledWith("/api/leads/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: expect.stringContaining('"phone":"+11234567890"'),
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body).toHaveProperty("tz_browser");
    expect(body.tz_ip).toBeNull();
  });

  it("includes browser timezone in payload", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await submitLead(leadData, "recaptcha-token");

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(typeof body.tz_browser).toBe("string");
    expect(body.tz_browser).toMatch(/^(?:[A-Za-z_+.-]+\/[A-Za-z_+.-]+|UTC|GMT)$/);
  });

  it("includes independent Google click IDs in the submission payload", async () => {
    window.history.replaceState({}, "", "/?gclid=gclid-1&gbraid=gbraid-1&wbraid=wbraid-1");
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await submitLead(leadData, "recaptcha-token");

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body).toMatchObject({
      gclid: "gclid-1",
      gbraid: "gbraid-1",
      wbraid: "wbraid-1",
    });

    window.history.replaceState({}, "", "/");
  });

  it("merges active session attribution into a submission from a clean internal route", async () => {
    window.history.replaceState({}, "", "/?gclid=gclid-first&utm_source=google&utm_campaign=launch");
    captureAttributionForDocumentEntry();
    window.history.replaceState({}, "", "/");
    captureAttributionForClientNavigation();
    localStorage.removeItem("tbh_geo_cache");
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await submitLead(leadData, "recaptcha-token");

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body).toMatchObject({
      gclid: "gclid-first",
      utm_source: "google",
      utm_campaign: "launch",
    });

    window.history.replaceState({}, "", "/");
    sessionStorage.removeItem("tbh_attribution_session");
  });

  it("does not merge a prior paid source after a direct organic document entry", async () => {
    window.history.replaceState({}, "", "/?gclid=gclid-first&utm_source=google&utm_campaign=launch");
    captureAttributionForDocumentEntry();
    window.history.replaceState({}, "", "/");
    captureAttributionForDocumentEntry();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await submitLead(leadData, "recaptcha-token");

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.gclid).toBeNull();
    expect(body.utm_source).toBeNull();
  });

  it("includes cached IP timezone and seller state in the payload when present", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    localStorage.setItem("tbh_geo_cache", JSON.stringify({
      city: "Tampa",
      state: "FL",
      country: "US",
      timezone: "America/New_York",
      ts: Date.now(),
    }));

    await submitLead(leadData, "recaptcha-token");

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.tz_ip).toBe("America/New_York");
    expect(body.seller_state).toBe("FL");

    localStorage.removeItem("tbh_geo_cache");
  });

  it("includes cached country for all submissions", async () => {
    localStorage.setItem("tbh_geo_cache", JSON.stringify({
      city: "Toronto",
      state: "Ontario",
      country: "CA",
      timezone: "America/Toronto",
      ts: Date.now(),
    }));
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ success: true }) });

    await submitLead({ ...leadData, source: "homepage" }, "recaptcha-token");
    let body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.seller_country).toBe("CA");

    (global.fetch as jest.Mock).mockClear();
    await submitLead({ ...leadData, source: "landing-california" }, "recaptcha-token");
    body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.seller_country).toBe("CA");

    localStorage.removeItem("tbh_geo_cache");
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

  it("throws the server error message when API returns non-OK response", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Server error" }),
    });

    await expect(submitLead(leadData, "recaptcha-token")).rejects.toThrow("Server error");
  });

  it("throws generic error when API response has no error message", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    await expect(submitLead(leadData, "recaptcha-token")).rejects.toThrow("Lead submission failed");
  });

  it("throws LeadSubmitError with code/message/reason when the address is rejected", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({
        error: "address_not_found",
        error_code: "no_match",
        message: "We couldn't find \"123 X\" on Google Maps. Please enter your complete street address.",
      }),
    });

    await expect(submitLead(leadData, "recaptcha-token")).rejects.toMatchObject({
      name: "LeadSubmitError",
      code: "address_not_found",
      reason: "no_match",
      message: "We couldn't find \"123 X\" on Google Maps. Please enter your complete street address.",
    });
  });

  it("isLeadAddressError() matches only address-rejection codes", async () => {
    expect(isLeadAddressError(new LeadSubmitError("nope", "address_not_found", "no_match"))).toBe(true);
    expect(isLeadAddressError(new LeadSubmitError("nope", "address_unverifiable", "network"))).toBe(true);
    expect(isLeadAddressError(new LeadSubmitError("nope", "other"))).toBe(false);
    expect(isLeadAddressError(new Error("nope"))).toBe(false);
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
