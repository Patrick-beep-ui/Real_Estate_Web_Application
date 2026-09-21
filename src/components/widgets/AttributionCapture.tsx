"use client";

import { useEffect } from "react";
import { captureAttributionNow } from "@/lib/tracking/traffic-source";

/**
 * Captures first-touch attribution (UTMs + click IDs) on every page so a
 * submission or call/SMS CTA from a later route keeps the original ad signal.
 */
const AttributionCapture = () => {
  useEffect(() => {
    captureAttributionNow();
  }, []);
  return null;
};

export default AttributionCapture;