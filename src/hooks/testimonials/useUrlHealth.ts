"use client";

import { useEffect, useState } from "react";
import { isSupabaseStorageUrl, isBrokenHttpStatus, type UrlHealth } from "@/lib/shared/url-health";

const DEBOUNCE_MS = 600;

export interface UrlHealthResult {
  state: UrlHealth;
  statusCode: number | null;
}

export function useUrlHealth(url: string | null): UrlHealthResult {
  const trimmedUrl = url?.trim() ?? "";
  const eligible = trimmedUrl !== "" && isSupabaseStorageUrl(trimmedUrl);
  const [result, setResult] = useState<UrlHealthResult>({ state: "unknown", statusCode: null });

  useEffect(() => {
    if (!eligible) return;

    let cancelled = false;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setResult({ state: "checking", statusCode: null });
      try {
        const res = await fetch(trimmedUrl, { method: "HEAD", signal: controller.signal });
        if (cancelled) return;
        if (res.ok) {
          setResult({ state: "ok", statusCode: res.status });
        } else if (isBrokenHttpStatus(res.status)) {
          setResult({ state: "broken", statusCode: res.status });
        } else {
          setResult({ state: "unknown", statusCode: res.status });
        }
      } catch {
        if (!cancelled) setResult({ state: "unknown", statusCode: null });
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [eligible, trimmedUrl]);

  if (!eligible) return { state: "unknown", statusCode: null };
  return result;
}
