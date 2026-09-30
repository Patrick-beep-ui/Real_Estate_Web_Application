"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/api";

export type DeliveryRow = {
  id: string;
  submission_id: string;
  service: string;
  operation: string;
  outcome: string;
  attempt_number: number;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  http_status: number | null;
  external_reference: string | null;
  meta_event_id: string | null;
  meta_events_received: number | null;
  error_code: string | null;
  error_message: string | null;
  metadata_redacted: unknown;
  created_at: string;
};

export type SubmissionRow = {
  id: string;
  created_at: string;
  lead_id: string | null;
  idempotency_key: string | null;
  source: string | null;
  page_path: string | null;
  traffic_classification: string;
  is_internal_test: boolean;
  form_status: string;
  meta_event_id: string | null;
  fbp: string | null;
  fbc: string | null;
  fbclid: string | null;
  fb_campaign_id: string | null;
  fb_adset_id: string | null;
  fb_ad_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  utm_id: string | null;
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  msclkid: string | null;
};

/** A submission joined with its delivery events, ordered oldest → newest. */
export type TrackingSubmission = SubmissionRow & {
  events: DeliveryRow[];
};

export type JourneyStatus =
  | "complete"
  | "partial"
  | "db_failed"
  | "ghl_failed"
  | "capi_failed"
  | "pending"
  | "needs_attention";

export type TrackingStatusFilter = "all" | JourneyStatus;
export type TrafficFilter =
  | "all"
  | "internal_test"
  | "meta_paid"
  | "google_paid"
  | "microsoft_paid"
  | "organic_direct"
  | "other"
  | "unknown";
export type TestFilter = "all" | "real" | "internal_test";

export type TrackingStats = {
  total: number;
  complete: number;
  partial: number;
  failed: number;
  internalTests: number;
  metaAccepted: number;
  capiMissing: number;
};

const LAST_30_DAYS = 30 * 24 * 60 * 60 * 1000;

function hasEvent(events: DeliveryRow[], service: string, outcome: string): boolean {
  return events.some((e) => e.service === service && e.outcome === outcome);
}

function hasStartedEvent(events: DeliveryRow[], service: string): boolean {
  return events.some((e) => e.service === service && e.outcome === "started");
}

/**
 * Derives a journey status from the recorded delivery events. `lead_id` is
 * treated as a reconciliation signal: a successful DB event with no linked
 * lead means the audit could not attach the row, which is surfaced as
 * `needs_attention` rather than being silently treated as healthy.
 */
export function getJourneyStatus(submission: TrackingSubmission): JourneyStatus {
  const { events, form_status, lead_id } = submission;
  const dbOk = hasEvent(events, "database", "succeeded");
  const dbFailed = hasEvent(events, "database", "failed");
  const ghlOk = hasEvent(events, "ghl_contact", "succeeded");
  const ghlFailed = hasEvent(events, "ghl_contact", "failed");
  const capiOk = hasEvent(events, "meta_capi", "succeeded");
  const capiFailed = hasEvent(events, "meta_capi", "failed");

  if (dbFailed) return "db_failed";
  if (dbOk && !lead_id) return "needs_attention";
  if (form_status === "failed") return "db_failed";
  if (ghlFailed) return "ghl_failed";
  if (capiFailed) return "capi_failed";

  const expectedSteps = 3;
  const passedSteps = [dbOk, ghlOk, capiOk].filter(Boolean).length;
  if (passedSteps === expectedSteps) return "complete";
  if (passedSteps > 0) return "partial";
  return "pending";
}

function defaultFromDate(): string {
  return new Date(Date.now() - LAST_30_DAYS).toISOString().slice(0, 10);
}

function localDayBoundary(date: string, endOfDay: boolean): string | undefined {
  if (!date) return undefined;
  const boundary = new Date(`${date}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(boundary.getTime()) ? undefined : boundary.toISOString();
}

export function useTrackingSubmissions() {
  const [fromDate, setFromDate] = useState<string>(defaultFromDate);
  const [toDate, setToDate] = useState<string>("");
  const [trafficFilter, setTrafficFilter] = useState<TrafficFilter>("all");
  const [statusFilter, setStatusFilter] = useState<TrackingStatusFilter>("all");
  const [testFilter, setTestFilter] = useState<TestFilter>("all");
  const [search, setSearch] = useState("");

  const from = localDayBoundary(fromDate, false);
  const to = localDayBoundary(toDate, true);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin-tracking-submissions", from, to, trafficFilter, testFilter],
    queryFn: async (): Promise<{ items: TrackingSubmission[]; truncated: boolean }> => {
      const params = new URLSearchParams({ traffic: trafficFilter, test: testFilter });
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      return adminApi.get<{ items: TrackingSubmission[]; truncated: boolean }>(
        `/api/admin/tracking?${params.toString()}`,
      );
    },
  });

  const submissions = useMemo(() => data?.items ?? [], [data]);

  const filteredSubmissions = useMemo(
    () =>
      submissions.filter((submission) => {
        if (statusFilter !== "all" && getJourneyStatus(submission) !== statusFilter) return false;

        const term = search.trim().toLowerCase();
        if (term) {
          const haystack = [
            submission.source,
            submission.page_path,
            submission.fb_campaign_id,
            submission.fb_adset_id,
            submission.fb_ad_id,
            submission.fbclid,
            submission.fbc,
            submission.fbp,
            submission.utm_campaign,
            submission.utm_term,
            submission.utm_id,
            submission.meta_event_id,
            submission.id,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(term)) return false;
        }

        return true;
      }),
    [submissions, statusFilter, search]
  );

  const stats: TrackingStats = useMemo(() => {
    const acc: TrackingStats = {
      total: filteredSubmissions.length,
      complete: 0,
      partial: 0,
      failed: 0,
      internalTests: 0,
      metaAccepted: 0,
      capiMissing: 0,
    };

    for (const submission of filteredSubmissions) {
      const status = getJourneyStatus(submission);
      if (status === "complete") acc.complete += 1;
      else if (status === "partial" || status === "needs_attention") acc.partial += 1;
      else if (status === "db_failed" || status === "ghl_failed" || status === "capi_failed") acc.failed += 1;

      if (submission.is_internal_test) acc.internalTests += 1;
      if (hasEvent(submission.events, "meta_capi", "succeeded")) acc.metaAccepted += 1;
      if (submission.meta_event_id && !hasStartedEvent(submission.events, "meta_capi")) acc.capiMissing += 1;
    }

    return acc;
  }, [filteredSubmissions]);

  const hasActiveFilters =
    trafficFilter !== "all" || statusFilter !== "all" || testFilter !== "all" || search.trim() !== "";

  const resetFilters = () => {
    setTrafficFilter("all");
    setStatusFilter("all");
    setTestFilter("all");
    setSearch("");
    setToDate("");
    setFromDate(defaultFromDate());
  };

  return {
    submissions: filteredSubmissions,
    allSubmissions: submissions,
    truncated: data?.truncated ?? false,
    isLoading,
    isFetching,
    error,
    refetch,
    stats,
    filters: {
      fromDate,
      toDate,
      trafficFilter,
      statusFilter,
      testFilter,
      search,
    },
    setFromDate,
    setToDate,
    setTrafficFilter,
    setStatusFilter,
    setTestFilter,
    setSearch,
    hasActiveFilters,
    resetFilters,
  };
}
