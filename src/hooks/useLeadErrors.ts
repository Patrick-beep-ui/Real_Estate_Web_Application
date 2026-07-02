"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

export type LeadError = {
  id: string;
  created_at: string;
  email: string | null;
  error_code: string | null;
  error_details: string | null;
  error_message: string | null;
  last_retry_at: string | null;
  market_slug: string | null;
  name: string | null;
  payload: Record<string, unknown> | null;
  phone: string | null;
  property_address: string | null;
  resolved: boolean;
  resolved_at: string | null;
  retry_count: number;
  situation_slug: string | null;
  source: string | null;
};

export type ErrorFilter = "all" | "db" | "ghl_api" | "ghl_fetch";
export type ResolvedFilter = "active" | "resolved" | "all";

export type LeadErrorStats = {
  total: number;
  db: number;
  ghlApi: number;
  ghlFetch: number;
  other: number;
  resolved: number;
  active: number;
};

export function useLeadErrors() {
  const [filter, setFilter] = useState<ErrorFilter>("all");
  const [resolvedFilter, setResolvedFilter] = useState<ResolvedFilter>("active");

  const { data: errors, isLoading } = useQuery({
    queryKey: ["admin-lead-errors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_errors")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Array<LeadError>;
    },
  });

  const filteredErrors = useMemo(() => {
    if (!errors) return [];
    let result = errors;
    if (resolvedFilter === "active") result = result.filter((e) => !e.resolved);
    else if (resolvedFilter === "resolved") result = result.filter((e) => e.resolved);
    if (filter === "all") return result;
    return result.filter((e) => {
      const code = e.error_code || "";
      switch (filter) {
        case "db": return !code.startsWith("GHL");
        case "ghl_api": return code === "GHL_ERROR";
        case "ghl_fetch": return code === "GHL_FETCH_ERROR";
        default: return true;
      }
    });
  }, [errors, filter, resolvedFilter]);

  const stats: LeadErrorStats = useMemo(() => {
    if (!errors) return { total: 0, db: 0, ghlApi: 0, ghlFetch: 0, other: 0, resolved: 0, active: 0 };
    const total = errors.length;
    const resolved = errors.filter((e) => e.resolved).length;
    const active = total - resolved;
    const db = errors.filter((e) => !(e.error_code || "").startsWith("GHL") && !e.resolved).length;
    const ghlApi = errors.filter((e) => e.error_code === "GHL_ERROR" && !e.resolved).length;
    const ghlFetch = errors.filter((e) => e.error_code === "GHL_FETCH_ERROR" && !e.resolved).length;
    const other = active - db - ghlApi - ghlFetch;
    return { total, db, ghlApi, ghlFetch, other, resolved, active };
  }, [errors]);

  const resolvedCount = useMemo(() => {
    if (!errors) return 0;
    return errors.filter((e) => e.resolved).length;
  }, [errors]);

  const visibleErrorIds = useMemo(() => filteredErrors.map((e) => e.id), [filteredErrors]);

  return {
    errors,
    isLoading,
    filteredErrors,
    stats,
    resolvedCount,
    visibleErrorIds,
    filter,
    setFilter,
    resolvedFilter,
    setResolvedFilter,
  };
}
