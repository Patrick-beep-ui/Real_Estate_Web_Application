const CONSENT_STORAGE_KEY = "cookie_consent";

export const DEFAULT_CONSENT_LEVEL = "essential";

/** Raw stored level: "all" | "essential" | "none" (legacy) | null (never chosen). */
export function getConsentLevel(): string | null {
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Stored site-analytics preference, falling back to the opt-in default when unset. */
export function getEffectiveConsentLevel(): string {
  return getConsentLevel() ?? DEFAULT_CONSENT_LEVEL;
}

/** True only when the visitor allowed site analytics. Never gates advertising measurement. */
export function hasAnalyticsConsent(): boolean {
  return getEffectiveConsentLevel() === "all";
}