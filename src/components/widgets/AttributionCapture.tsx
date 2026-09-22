"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  captureAttributionForClientNavigation,
  captureAttributionForDocumentEntry,
} from "@/lib/tracking/traffic-source";

/**
 * Starts one attribution session per browser document entry and retains that
 * source only while the visitor navigates within the site. Direct/external
 * entries reset the session, preventing old paid data from leaking into a
 * later organic visit.
 */
const AttributionCaptureClient = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialRun = useRef(true);
  const search = searchParams?.toString() || "";

  useEffect(() => {
    if (isInitialRun.current) {
      isInitialRun.current = false;
      captureAttributionForDocumentEntry();
      return;
    }
    captureAttributionForClientNavigation();
  }, [pathname, search]);

  return null;
};

const AttributionCapture = () => (
  <Suspense fallback={null}>
    <AttributionCaptureClient />
  </Suspense>
);

export default AttributionCapture;
