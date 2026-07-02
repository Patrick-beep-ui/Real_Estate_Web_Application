"use client";

import { useState, useCallback } from "react";
import { useLeadErrors } from "@/hooks/useLeadErrors";
import { useLeadErrorMutations } from "@/hooks/useLeadErrorMutations";
import { LeadErrorStatsCards } from "@/components/admin/lead-errors/LeadErrorStatsCards";
import { LeadErrorToolbar } from "@/components/admin/lead-errors/LeadErrorToolbar";
import { LeadErrorTable } from "@/components/admin/lead-errors/LeadErrorTable";
import { LeadErrorConfirmDialog } from "@/components/admin/lead-errors/LeadErrorConfirmDialog";
import { LeadErrorEditDialog } from "@/components/admin/lead-errors/LeadErrorEditDialog";
import { LeadErrorClearDialog } from "@/components/admin/lead-errors/LeadErrorClearDialog";
import { RetryProgressModal, type RetryResult } from "@/components/admin/lead-errors/RetryProgressModal";
import type { LeadError } from "@/hooks/useLeadErrors";
import type { RetryParams } from "@/hooks/useLeadErrorMutations";

const AdminLeadErrors = () => {
  const {
    filteredErrors, isLoading, stats, resolvedCount, visibleErrorIds,
    filter, setFilter, resolvedFilter, setResolvedFilter,
  } = useLeadErrors();
  const { retryMutation, deleteMutation, clearResolvedMutation } = useLeadErrorMutations();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [confirmRetryError, setConfirmRetryError] = useState<LeadError | null>(null);
  const [editingError, setEditingError] = useState<LeadError | null>(null);
  const [editPayload, setEditPayload] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [clearResolvedOpen, setClearResolvedOpen] = useState(false);
  const [retryProgressOpen, setRetryProgressOpen] = useState(false);
  const [retryLeadName, setRetryLeadName] = useState("");
  const [retryResult, setRetryResult] = useState<RetryResult | null>(null);
  const [retryApiError, setRetryApiError] = useState<string | null>(null);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (!filteredErrors) return;
    if (selectedIds.size === visibleErrorIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleErrorIds));
    }
  }, [filteredErrors, selectedIds.size, visibleErrorIds]);

  const openEditRetry = useCallback((err: LeadError) => {
    const p = (err.payload || {}) as Record<string, unknown>;
    setEditPayload({
      name: String(p.name || err.name || ""),
      phone: String(p.phone || err.phone || ""),
      email: String(p.email || err.email || ""),
      property_address: String(p.property_address || err.property_address || ""),
      market_slug: String(p.market_slug || err.market_slug || ""),
      situation_slug: String(p.situation_slug || err.situation_slug || ""),
      source: String(p.source || err.source || ""),
    });
    setEditingError(err);
  }, []);

  const handleRetry = useCallback((err: LeadError) => {
    setRetryLeadName(err.name || "Lead");
    setRetryProgressOpen(true);
    retryMutation.mutate(
      { errorRecord: err },
      {
        onSuccess: (result) => {
          setRetryResult(result);
          setConfirmRetryError(null);
          setEditingError(null);
        },
        onError: (error) => {
          setRetryApiError((error as Error).message);
          setConfirmRetryError(null);
        },
      }
    );
  }, [retryMutation]);

  const handleEditedRetry = useCallback(() => {
    if (!editingError) return;
    const modifiedPayload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(editPayload)) {
      if (value) modifiedPayload[key] = value;
    }
    setRetryLeadName(editingError.name || "Lead");
    const err = editingError;
    setEditingError(null);
    setRetryProgressOpen(true);
    retryMutation.mutate(
      { errorRecord: err, modifiedPayload },
      {
        onSuccess: (result) => {
          setRetryResult(result);
        },
        onError: (error) => {
          setRetryApiError((error as Error).message);
        },
      }
    );
  }, [editingError, editPayload, retryMutation]);

  const handleBulkRetry = useCallback(() => {
    const selected = filteredErrors.filter((e) => selectedIds.has(e.id) && !e.resolved);
    for (const err of selected) {
      retryMutation.mutate({ errorRecord: err });
    }
  }, [filteredErrors, selectedIds, retryMutation]);

  const showBulkRetry = resolvedFilter !== "resolved" && filteredErrors.some((e) => !e.resolved && selectedIds.size > 0);

  return (
    <div className="space-y-6">
      <LeadErrorToolbar
        resolvedFilter={resolvedFilter}
        onResolvedFilterChange={setResolvedFilter}
        filter={filter}
        onFilterChange={setFilter}
        resolvedCount={resolvedCount}
        selectedCount={selectedIds.size}
        showBulkRetry={showBulkRetry}
        onClearResolvedOpen={() => setClearResolvedOpen(true)}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkRetry={handleBulkRetry}
        isRetrying={retryMutation.isPending}
      />

      <LeadErrorStatsCards stats={stats} />

      <LeadErrorTable
        errors={filteredErrors}
        isLoading={isLoading}
        resolvedFilter={resolvedFilter}
        selectedIds={selectedIds}
        visibleErrorIds={visibleErrorIds}
        expandedId={expandedId}
        deleteConfirmId={deleteConfirmId}
        retryingId={retryMutation.isPending ? (retryMutation.variables as RetryParams | undefined)?.errorRecord?.id ?? null : null}
        onToggleSelected={toggleSelected}
        onToggleAll={toggleAll}
        onExpand={setExpandedId}
        onRetry={(err) => setConfirmRetryError(err)}
        onEditRetry={openEditRetry}
        onDeleteConfirm={setDeleteConfirmId}
        onDeleteMutate={(id) => deleteMutation.mutate(id)}
        onDeleteDialogClose={() => setDeleteConfirmId(null)}
      />

      <LeadErrorConfirmDialog
        error={confirmRetryError}
        onClose={() => setConfirmRetryError(null)}
        onConfirm={() => {
          if (confirmRetryError) handleRetry(confirmRetryError);
        }}
      />

      <LeadErrorEditDialog
        error={editingError}
        editPayload={editPayload}
        onPayloadChange={setEditPayload}
        onClose={() => setEditingError(null)}
        onConfirm={handleEditedRetry}
        isPending={retryMutation.isPending}
      />

      <LeadErrorClearDialog
        open={clearResolvedOpen}
        onOpenChange={setClearResolvedOpen}
        resolvedCount={resolvedCount}
        isPending={clearResolvedMutation.isPending}
        onConfirm={() => clearResolvedMutation.mutate()}
      />

      <RetryProgressModal
        open={retryProgressOpen}
        onClose={() => {
          setRetryProgressOpen(false);
          setRetryResult(null);
          setRetryApiError(null);
        }}
        leadName={retryLeadName}
        result={retryResult}
        apiError={retryApiError}
      />
    </div>
  );
};

export default AdminLeadErrors;
