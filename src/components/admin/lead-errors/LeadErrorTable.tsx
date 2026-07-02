"use client";

import { Loader2, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LeadErrorRow } from "./LeadErrorRow";
import type { LeadError, ResolvedFilter } from "@/hooks/useLeadErrors";

interface LeadErrorTableProps {
  errors: LeadError[];
  isLoading: boolean;
  resolvedFilter: ResolvedFilter;
  selectedIds: Set<string>;
  visibleErrorIds: string[];
  expandedId: string | null;
  deleteConfirmId: string | null;
  retryingId: string | null;
  onToggleSelected: (id: string) => void;
  onToggleAll: () => void;
  onExpand: (id: string | null) => void;
  onRetry: (err: LeadError) => void;
  onEditRetry: (err: LeadError) => void;
  onDeleteConfirm: (id: string | null) => void;
  onDeleteMutate: (id: string) => void;
  onDeleteDialogClose: () => void;
}

export function LeadErrorTable({
  errors, isLoading, resolvedFilter,
  selectedIds, visibleErrorIds,
  expandedId, deleteConfirmId, retryingId,
  onToggleSelected, onToggleAll, onExpand,
  onRetry, onEditRetry, onDeleteConfirm, onDeleteMutate, onDeleteDialogClose,
}: LeadErrorTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (errors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <AlertTriangle className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-sm">No error records found</p>
      </div>
    );
  }

  const allSelected = selectedIds.size === visibleErrorIds.length && visibleErrorIds.length > 0;
  const showCheckboxes = resolvedFilter !== "resolved";

  return (
    <div className="rounded border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              {showCheckboxes && (
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onToggleAll}
                />
              )}
            </TableHead>
            <TableHead className="w-8"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Error Code</TableHead>
            <TableHead>Error Message</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Retried</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {errors.map((err) => (
            <LeadErrorRow
              key={err.id}
              error={err}
              isExpanded={expandedId === err.id}
              isSelected={selectedIds.has(err.id)}
              isRetryingThis={retryingId === err.id}
              showCheckbox={showCheckboxes}
              deleteConfirmId={deleteConfirmId}
              onToggleExpand={() => onExpand(expandedId === err.id ? null : err.id)}
              onToggleSelected={() => onToggleSelected(err.id)}
              onRetry={() => onRetry(err)}
              onEditRetry={() => onEditRetry(err)}
              onDeleteConfirm={() => onDeleteConfirm(err.id)}
              onDeleteMutate={() => onDeleteMutate(err.id)}
              onDeleteDialogClose={onDeleteDialogClose}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
