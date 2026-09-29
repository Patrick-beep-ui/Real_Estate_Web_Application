"use client";

import type { JourneyStatus } from "@/hooks/tracking/useTrackingSubmissions";

const STATUS_STYLES: Record<JourneyStatus, { label: string; className: string }> = {
  complete: { label: "Complete", className: "bg-green-500/10 text-green-600 border-green-500/30" },
  partial: { label: "Partial", className: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  needs_attention: { label: "Needs attention", className: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  pending: { label: "Pending", className: "bg-muted text-muted-foreground border-border" },
  db_failed: { label: "DB failed", className: "bg-destructive/10 text-destructive border-destructive/30" },
  ghl_failed: { label: "GHL failed", className: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
  capi_failed: { label: "CAPI failed", className: "bg-red-500/10 text-red-600 border-red-500/30" },
};

const OUTCOME_STYLES: Record<string, string> = {
  succeeded: "bg-green-500/10 text-green-600 border-green-500/30",
  failed: "bg-destructive/10 text-destructive border-destructive/30",
  skipped: "bg-muted text-muted-foreground border-border",
  started: "bg-blue-500/10 text-blue-600 border-blue-500/30",
};

export function JourneyStatusBadge({ status }: { status: JourneyStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${style.className}`}>
      {style.label}
    </span>
  );
}

export function DeliveryOutcomeBadge({ outcome }: { outcome: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
        OUTCOME_STYLES[outcome] ?? "bg-muted text-muted-foreground border-border"
      }`}
    >
      {outcome}
    </span>
  );
}
