"use client";

import { Trash2, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ErrorFilter, ResolvedFilter } from "@/hooks/leads/errors/useLeadErrors";

interface LeadErrorToolbarProps {
  resolvedFilter: ResolvedFilter;
  onResolvedFilterChange: (v: ResolvedFilter) => void;
  filter: ErrorFilter;
  onFilterChange: (v: ErrorFilter) => void;
  resolvedCount: number;
  selectedCount: number;
  showBulkRetry: boolean;
  onClearResolvedOpen: () => void;
  onClearSelection: () => void;
  onBulkRetry: () => void;
  isRetrying: boolean;
}

export function LeadErrorToolbar({
  resolvedFilter, onResolvedFilterChange,
  filter, onFilterChange,
  resolvedCount, selectedCount,
  showBulkRetry,
  onClearResolvedOpen, onClearSelection,
  onBulkRetry, isRetrying,
}: LeadErrorToolbarProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Lead Errors</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-md bg-muted p-0.5">
            {(["active", "resolved", "all"] as const).map((v) => (
              <button
                key={v}
                onClick={() => onResolvedFilterChange(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                  resolvedFilter === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v === "active" ? "Active" : v === "resolved" ? "Resolved" : "All"}
              </button>
            ))}
          </div>
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as ErrorFilter)}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs text-muted-foreground"
          >
            <option value="all">All Errors</option>
            <option value="db">Database Errors</option>
            <option value="ghl_api">GHL API Errors</option>
            <option value="ghl_fetch">GHL Network Errors</option>
          </select>
          {resolvedCount > 0 && resolvedFilter === "resolved" && (
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={onClearResolvedOpen}>
              <Trash2 className="w-3 h-3" />
              Clear Resolved
            </Button>
          )}
        </div>
      </div>

      {showBulkRetry && selectedCount > 0 && (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="text-xs gap-1" onClick={onBulkRetry} disabled={isRetrying}>
            {isRetrying ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
            Retry Selected ({selectedCount})
          </Button>
          <Button variant="ghost" size="sm" className="text-xs" onClick={onClearSelection}>
            Clear selection
          </Button>
        </div>
      )}
    </div>
  );
}
