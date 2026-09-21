const CONSENT_STORAGE_KEY = "cookie_consent";

/**
 * Consent-light default: a visitor who has not dismissed or answered the
 * banner is treated as consented to analytics, so tracking is not silently
 * lost on routes that never got a per-page banner. Explicit "essential" or
 * "none" choices are still honored.
 */
export const DEFAULT_CONSENT_LEVEL = "all";

/** Raw stored level: "all" | "essential" | "none" | null (never chosen). */
export function getConsentLevel(): string | null {
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Stored level, falling back to the consent-light default when unset. */
export function getEffectiveConsentLevel(): string {
  return getConsentLevel() ?? DEFAULT_CONSENT_LEVEL;
}

export function hasAnalyticsConsent(): boolean {
  return getEffectiveConsentLevel() === "all";
}