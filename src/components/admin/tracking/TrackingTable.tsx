"use client";

import { Loader2, Inbox } from "lucide-react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrackingRow } from "./TrackingRow";
import type { TrackingSubmission } from "@/hooks/tracking/useTrackingSubmissions";

interface TrackingTableProps {
  submissions: TrackingSubmission[];
  isLoading: boolean;
  expandedId: string | null;
  onToggleExpand: (id: string | null) => void;
  hasActiveFilters: boolean;
}

export function TrackingTable({ submissions, isLoading, expandedId, onToggleExpand, hasActiveFilters }: TrackingTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Inbox className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-sm">
          {hasActiveFilters ? "No journeys match the current filters" : "No delivery journeys recorded yet"}
        </p>
        {!hasActiveFilters && (
          <p className="text-xs mt-1 max-w-md text-center">
            Submit the form with <span className="font-mono">?tracking_test=1</span> to verify the full
            form → lead → GHL → CAPI path.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Journey</TableHead>
            <TableHead>Attribution</TableHead>
            <TableHead>Page</TableHead>
            <TableHead>Lead</TableHead>
            <TableHead>Meta CAPI</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => (
            <TrackingRow
              key={submission.id}
              submission={submission}
              isExpanded={expandedId === submission.id}
              onToggleExpand={() => onToggleExpand(expandedId === submission.id ? null : submission.id)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
