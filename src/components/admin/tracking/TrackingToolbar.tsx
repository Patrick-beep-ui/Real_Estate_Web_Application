"use client";

import { Search, RotateCcw, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  exportJourneyCsv,
  exportJourneyXlsx,
  exportDeliveryEventsCsv,
  exportDeliveryEventsXlsx,
} from "@/lib/tracking/admin-export";
import type { TrafficFilter, TrackingStatusFilter, TestFilter, TrackingSubmission } from "@/hooks/tracking/useTrackingSubmissions";

const selectClass = "h-9 rounded-md border border-input bg-background px-3 text-xs text-muted-foreground";

const TRAFFIC_OPTIONS: Array<{ value: TrafficFilter; label: string }> = [
  { value: "all", label: "All traffic" },
  { value: "internal_test", label: "Internal test" },
  { value: "meta_paid", label: "Meta paid" },
  { value: "google_paid", label: "Google paid" },
  { value: "microsoft_paid", label: "Microsoft paid" },
  { value: "organic_direct", label: "Organic / direct" },
  { value: "other", label: "Other" },
  { value: "unknown", label: "Unknown source" },
];

const STATUS_OPTIONS: Array<{ value: TrackingStatusFilter; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "complete", label: "Complete" },
  { value: "partial", label: "Partial" },
  { value: "needs_attention", label: "Needs attention" },
  { value: "pending", label: "Pending" },
  { value: "db_failed", label: "DB failed" },
  { value: "ghl_failed", label: "GHL failed" },
  { value: "capi_failed", label: "CAPI failed" },
];

interface TrackingToolbarProps {
  fromDate: string;
  toDate: string;
  trafficFilter: TrafficFilter;
  statusFilter: TrackingStatusFilter;
  testFilter: TestFilter;
  search: string;
  hasActiveFilters: boolean;
  isFetching: boolean;
  visibleCount: number;
  truncated: boolean;
  submissions: TrackingSubmission[];
  onFromDateChange: (v: string) => void;
  onToDateChange: (v: string) => void;
  onTrafficFilterChange: (v: TrafficFilter) => void;
  onStatusFilterChange: (v: TrackingStatusFilter) => void;
  onTestFilterChange: (v: TestFilter) => void;
  onSearchChange: (v: string) => void;
  onReset: () => void;
}

export function TrackingToolbar({
  fromDate, toDate,
  trafficFilter, statusFilter, testFilter, search,
  hasActiveFilters, isFetching, visibleCount, truncated, submissions,
  onFromDateChange, onToDateChange,
  onTrafficFilterChange, onStatusFilterChange, onTestFilterChange,
  onSearchChange, onReset,
}: TrackingToolbarProps) {
  const hasData = submissions.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lead Delivery Tracking</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Form → local lead → GHL → Meta CAPI. Audit rows never contain name, phone, or email.
          </p>
        </div>
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          From
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            className={selectClass}
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          To
          <input
            type="date"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
            className={selectClass}
          />
        </label>

        <select
          value={trafficFilter}
          onChange={(e) => onTrafficFilterChange(e.target.value as TrafficFilter)}
          className={selectClass}
          aria-label="Traffic source filter"
        >
          {TRAFFIC_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as TrackingStatusFilter)}
          className={selectClass}
          aria-label="Journey status filter"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={testFilter}
          onChange={(e) => onTestFilterChange(e.target.value as TestFilter)}
          className={selectClass}
          aria-label="Internal test filter"
        >
          <option value="all">Real + test</option>
          <option value="real">Real traffic only</option>
          <option value="internal_test">Internal tests only</option>
        </select>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search IDs, UTM, path…"
            className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground"
            aria-label="Search tracking submissions"
          />
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-9 text-xs gap-1" onClick={onReset}>
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <span className="text-xs text-muted-foreground mr-1">
          {visibleCount} journey{visibleCount === 1 ? "" : "s"}
        </span>
        {truncated && (
          <span className="text-xs text-amber-600">
            Showing the newest 1,000 matching journeys. Narrow the date range to export all matching records.
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1"
          disabled={!hasData}
          onClick={() => exportJourneyCsv(submissions)}
        >
          <Download className="w-3 h-3" />
          Journeys CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          disabled={!hasData}
          onClick={() => exportJourneyXlsx(submissions)}
        >
          Journeys XLSX
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1"
          disabled={!hasData}
          onClick={() => exportDeliveryEventsCsv(submissions)}
        >
          <Download className="w-3 h-3" />
          Delivery events CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          disabled={!hasData}
          onClick={() => exportDeliveryEventsXlsx(submissions)}
        >
          Delivery events XLSX
        </Button>
      </div>
    </div>
  );
}