"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/tracking/analytics";

/**
 * Initializes analytics-only scripts (GA4, Google Ads) on every route once
 * consent is in place, so returning visitors do not lose tracking on pages
 * that never had a per-page init. The consent-light default treats a missing
 * consent choice as full consent.
 */
const AnalyticsInit = () => {
  useEffect(() => {
    initAnalytics();
  }, []);
  return null;
};

export default AnalyticsInit;