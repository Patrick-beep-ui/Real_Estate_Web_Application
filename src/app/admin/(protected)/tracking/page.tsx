"use client";

import { useState } from "react";
import { useTrackingSubmissions } from "@/hooks/tracking/useTrackingSubmissions";
import { TrackingStatsCards } from "@/components/admin/tracking/TrackingStatsCards";
import { TrackingToolbar } from "@/components/admin/tracking/TrackingToolbar";
import { TrackingTable } from "@/components/admin/tracking/TrackingTable";

const AdminTracking = () => {
  const {
    submissions, truncated, isLoading, isFetching, error, refetch, stats, filters,
    setFromDate, setToDate, setTrafficFilter, setStatusFilter, setTestFilter,
    setSearch, hasActiveFilters, resetFilters,
  } = useTrackingSubmissions();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <TrackingToolbar
        fromDate={filters.fromDate}
        toDate={filters.toDate}
        trafficFilter={filters.trafficFilter}
        statusFilter={filters.statusFilter}
        testFilter={filters.testFilter}
        search={filters.search}
        hasActiveFilters={hasActiveFilters}
        isFetching={isFetching}
        visibleCount={submissions.length}
        truncated={truncated}
        submissions={submissions}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onTrafficFilterChange={setTrafficFilter}
        onStatusFilterChange={setStatusFilter}
        onTestFilterChange={setTestFilter}
        onSearchChange={setSearch}
        onReset={resetFilters}
      />

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load tracking data: {error.message}
          <button onClick={() => refetch()} className="ml-3 underline">
            Retry
          </button>
        </div>
      )}

      <TrackingStatsCards stats={stats} />

      <TrackingTable
        submissions={submissions}
        isLoading={isLoading}
        expandedId={expandedId}
        onToggleExpand={setExpandedId}
        hasActiveFilters={hasActiveFilters}
      />
    </div>
  );
};

export default AdminTracking;