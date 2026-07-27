"use client";

import { useMemo } from "react";
import { usePageConfig } from "@/context/PageContext";

export function useStablePhoneLinks() {
  const { phone, smsLink, telLink, text } = usePageConfig();
  return useMemo(() => ({ phone, smsLink, telLink, text }), []);
}
