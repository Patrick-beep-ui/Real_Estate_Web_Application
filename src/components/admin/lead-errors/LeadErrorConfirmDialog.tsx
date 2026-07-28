"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getRetryRiskLabel, getRetryAdvice } from "@/lib/leads/error-classification";
import { formatDate, getErrorBadge, getRiskBadge } from "./utils";
import type { LeadError } from "@/hooks/leads/errors/useLeadErrors";

interface LeadErrorConfirmDialogProps {
  error: LeadError | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function LeadErrorConfirmDialog({ error, onClose, onConfirm }: LeadErrorConfirmDialogProps) {
  return (
    <AlertDialog open={!!error} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Retry</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Re-submit <strong>{error?.name || "Unknown"}</strong> through the full pipeline (DB + GHL)?
              </p>
              {error && (
                <>
                  <div className="flex items-center gap-2">
                    {getErrorBadge(error.error_code)}
                    {getRiskBadge(error.error_code)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getRetryRiskLabel(error.error_code)}
                  </p>
                  <p className="text-sm text-muted-foreground bg-muted rounded-md p-3">
                    {getRetryAdvice(error.error_code, error.error_message)}
                  </p>
                  {error.retry_count > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Previously retried {error.retry_count}x
                      {error.last_retry_at ? ` (last: ${formatDate(error.last_retry_at)})` : ""}
                    </p>
                  )}
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} className="cursor-pointer">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="cursor-pointer">
            Confirm Retry
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
