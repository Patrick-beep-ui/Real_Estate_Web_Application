"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/tracking/analytics";

/**
 * Initializes tracking on every route, so returning visitors do not lose
 * measurement on pages that never had a per-page init. Google Ads and Meta
 * start regardless of the cookie preference because advertising measurement
 * is not consent-gated; GA4 is configured only when site analytics are
 * allowed, and again when the visitor grants it later through the
 * `cookie_consent_change` listener in `@/lib/tracking/analytics`.
 */
const AnalyticsInit = () => {
  useEffect(() => {
    initAnalytics();
  }, []);
  return null;
};

export default AnalyticsInit;