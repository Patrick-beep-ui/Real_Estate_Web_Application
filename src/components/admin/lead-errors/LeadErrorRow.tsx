"use client";

import { ChevronDown, ChevronRight, CheckCircle2, RotateCcw, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDate, formatSlug, getErrorBadge, getRiskBadge, formatErrorDetails } from "./utils";
import type { LeadError } from "@/hooks/useLeadErrors";

interface LeadErrorRowProps {
  error: LeadError;
  isExpanded: boolean;
  isSelected: boolean;
  isRetryingThis: boolean;
  showCheckbox: boolean;
  deleteConfirmId: string | null;
  onToggleExpand: () => void;
  onToggleSelected: () => void;
  onRetry: () => void;
  onEditRetry: () => void;
  onDeleteConfirm: () => void;
  onDeleteMutate: () => void;
  onDeleteDialogClose: () => void;
}

export function LeadErrorRow({
  error: err,
  isExpanded, isSelected, isRetryingThis, showCheckbox,
  deleteConfirmId,
  onToggleExpand, onToggleSelected,
  onRetry, onEditRetry, onDeleteConfirm, onDeleteMutate, onDeleteDialogClose,
}: LeadErrorRowProps) {
  const isDeleteOpen = deleteConfirmId === err.id;

  return (
    <>
      <TableRow
        className={`hover:bg-muted/50 cursor-pointer ${err.resolved ? "opacity-60" : ""}`}
        onClick={onToggleExpand}
      >
        <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
          {showCheckbox && !err.resolved && (
            <Checkbox checked={isSelected} onCheckedChange={onToggleSelected} />
          )}
        </TableCell>
        <TableCell className="p-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell className="font-medium">
          {err.resolved && <CheckCircle2 className="w-3 h-3 inline mr-1 text-green-400" />}
          {err.name || "—"}
        </TableCell>
        <TableCell>
          {err.phone ? (
            <span className="text-xs text-muted-foreground">{err.phone}</span>
          ) : (
            <span className="text-xs text-muted-foreground/50">—</span>
          )}
        </TableCell>
        <TableCell>
          {err.email ? (
            <span className="text-xs text-muted-foreground truncate block max-w-[180px]">{err.email}</span>
          ) : (
            <span className="text-xs text-muted-foreground/50">—</span>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            {getErrorBadge(err.error_code)}
            {!err.resolved && getRiskBadge(err.error_code)}
          </div>
        </TableCell>
        <TableCell className="max-w-[180px]">
          <span className="text-xs text-muted-foreground truncate block">
            {err.error_message || "—"}
          </span>
        </TableCell>
        <TableCell>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(err.created_at)}</span>
        </TableCell>
        <TableCell>
          {err.retry_count > 0 ? (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {err.retry_count}x{err.last_retry_at ? ` ${formatDate(err.last_retry_at)}` : ""}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/50">—</span>
          )}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            {!err.resolved && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  disabled={isRetryingThis}
                  onClick={onRetry}
                >
                  {isRetryingThis ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3 h-3" />
                  )}
                  Retry
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={onEditRetry}
                >
                  Edit & Retry
                </Button>
              </>
            )}
            <AlertDialog open={isDeleteOpen} onOpenChange={(open) => !open && onDeleteDialogClose()}>
              <AlertDialogTrigger asChild>
                <button
                  onClick={onDeleteConfirm}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Delete
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Error Record</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the error for <strong>{err.name || "Unknown"}</strong>? This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={onDeleteDialogClose} className="cursor-pointer">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDeleteMutate}
                    className="bg-destructive hover:bg-destructive/90 cursor-pointer"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow key={`${err.id}-details`}>
          <TableCell colSpan={10} className="bg-muted/20 p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">Market</p>
                <p className="text-foreground">{formatSlug(err.market_slug)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">Situation</p>
                <p className="text-foreground">{formatSlug(err.situation_slug)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">Source</p>
                <p className="text-foreground">{err.source || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">Property Address</p>
                <p className="text-foreground">{err.property_address || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">Error Code</p>
                <p className="text-foreground font-mono text-xs">{err.error_code || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">Error Message</p>
                <p className="text-foreground text-xs">{err.error_message || "—"}</p>
              </div>
            </div>
            {err.retry_count > 0 && (
              <div className="mt-3 text-xs text-muted-foreground">
                Retried {err.retry_count}x{err.last_retry_at ? ` — last: ${formatDate(err.last_retry_at)}` : ""}
              </div>
            )}
            {err.error_details && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Error Details</p>
                <pre className="text-xs bg-background border border-border rounded-md p-3 overflow-x-auto max-h-[300px] text-foreground/80">
                  {formatErrorDetails(err.error_details)}
                </pre>
              </div>
            )}
            {err.payload && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Stored Payload</p>
                <pre className="text-xs bg-background border border-border rounded-md p-3 overflow-x-auto max-h-[300px] text-foreground/80">
                  {JSON.stringify(err.payload, null, 2)}
                </pre>
              </div>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
