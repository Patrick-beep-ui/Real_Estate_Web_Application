/// <reference types="jest" />

import { getConsentLevel, getEffectiveConsentLevel, hasAnalyticsConsent, DEFAULT_CONSENT_LEVEL } from "@/lib/tracking/consent";

describe("consent.ts — consent-light default", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("exposes a consent-light default of full consent", () => {
    expect(DEFAULT_CONSENT_LEVEL).toBe("all");
  });

  it("treats a missing consent choice as full consent", () => {
    expect(getConsentLevel()).toBeNull();
    expect(getEffectiveConsentLevel()).toBe("all");
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it("honors an explicit 'all' choice", () => {
    localStorage.setItem("cookie_consent", "all");
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it("blocks analytics on explicit 'essential' choice", () => {
    localStorage.setItem("cookie_consent", "essential");
    expect(getEffectiveConsentLevel()).toBe("essential");
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("blocks analytics on explicit 'none' choice", () => {
    localStorage.setItem("cookie_consent", "none");
    expect(getEffectiveConsentLevel()).toBe("none");
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("falls back to the default when storage is unavailable", () => {
    const getItemSpy = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(getConsentLevel()).toBeNull();
    expect(getEffectiveConsentLevel()).toBe("all");
    expect(hasAnalyticsConsent()).toBe(true);
    getItemSpy.mockRestore();
  });
});