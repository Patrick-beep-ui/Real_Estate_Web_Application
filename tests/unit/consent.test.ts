/// <reference types="jest" />

import { getConsentLevel, getEffectiveConsentLevel, hasAnalyticsConsent, DEFAULT_CONSENT_LEVEL } from "@/lib/tracking/consent";

describe("consent.ts — site analytics preference", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("exposes a default of no site analytics", () => {
    expect(DEFAULT_CONSENT_LEVEL).toBe("essential");
  });

  it("treats a missing choice as no site analytics", () => {
    expect(getConsentLevel()).toBeNull();
    expect(getEffectiveConsentLevel()).toBe("essential");
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("enables site analytics on explicit 'all' choice", () => {
    localStorage.setItem("cookie_consent", "all");
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it("disables site analytics on explicit 'essential' choice", () => {
    localStorage.setItem("cookie_consent", "essential");
    expect(getEffectiveConsentLevel()).toBe("essential");
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("disables site analytics on legacy 'none' choice", () => {
    localStorage.setItem("cookie_consent", "none");
    expect(getEffectiveConsentLevel()).toBe("none");
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("falls back to the no-analytics default when storage is unavailable", () => {
    const getItemSpy = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(getConsentLevel()).toBeNull();
    expect(getEffectiveConsentLevel()).toBe("essential");
    expect(hasAnalyticsConsent()).toBe(false);
    getItemSpy.mockRestore();
  });
});
