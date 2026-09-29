"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { Database, Json } from "@/lib/supabase/types";

type SubmissionRow = Database["public"]["Tables"]["tracking_submissions"]["Row"];
type DeliveryRow = Database["public"]["Tables"]["tracking_delivery_events"]["Row"];

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
export type TrafficFilter = "all" | SubmissionRow["traffic_classification"] | "unknown";
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

function withinDateRange(iso: string, from: string | null, to: string | null): boolean {
  const created = new Date(iso).getTime();
  if (from) {
    const fromTime = new Date(`${from}T00:00:00`).getTime();
    if (Number.isNaN(fromTime) || created < fromTime) return false;
  }
  if (to) {
    const toTime = new Date(`${to}T23:59:59.999`).getTime();
    if (Number.isNaN(toTime) || created > toTime) return false;
  }
  return true;
}

function defaultFromDate(): string {
  return new Date(Date.now() - LAST_30_DAYS).toISOString().slice(0, 10);
}

export function useTrackingSubmissions() {
  const [fromDate, setFromDate] = useState<string>(defaultFromDate);
  const [toDate, setToDate] = useState<string>("");
  const [trafficFilter, setTrafficFilter] = useState<TrafficFilter>("all");
  const [statusFilter, setStatusFilter] = useState<TrackingStatusFilter>("all");
  const [testFilter, setTestFilter] = useState<TestFilter>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin-tracking-submissions"],
    queryFn: async (): Promise<TrackingSubmission[]> => {
      const { data: submissions, error: submissionsError } = await supabase
        .from("tracking_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (submissionsError) throw submissionsError;
      if (!submissions || submissions.length === 0) return [];

      const ids = submissions.map((s) => s.id);
      const { data: events, error: eventsError } = await supabase
        .from("tracking_delivery_events")
        .select("*")
        .in("submission_id", ids)
        .order("created_at", { ascending: true });

      if (eventsError) throw eventsError;

      const bySubmission = new Map<string, DeliveryRow[]>();
      for (const event of events || []) {
        const bucket = bySubmission.get(event.submission_id);
        if (bucket) bucket.push(event);
        else bySubmission.set(event.submission_id, [event]);
      }

      return submissions.map((submission) => ({
        ...submission,
        events: bySubmission.get(submission.id) ?? [],
      }));
    },
  });

  const submissions = useMemo(() => data ?? [], [data]);

  const filteredSubmissions = useMemo(
    () =>
      submissions.filter((submission) => {
        if (!withinDateRange(submission.created_at, fromDate, toDate || null)) return false;

        if (trafficFilter === "unknown" && submission.source) return false;
        if (trafficFilter !== "all" && trafficFilter !== "unknown") {
          if (submission.traffic_classification !== trafficFilter) return false;
        }

        if (testFilter === "internal_test" && !submission.is_internal_test) return false;
        if (testFilter === "real" && submission.is_internal_test) return false;

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
    [submissions, fromDate, toDate, trafficFilter, statusFilter, testFilter, search]
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

export type { DeliveryRow, SubmissionRow, Json };
