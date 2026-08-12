"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/tracking/analytics";

const LandingAnalyticsInit = () => {
  useEffect(() => {
    initAnalytics();
  }, []);
  return null;
};

export default LandingAnalyticsInit;
