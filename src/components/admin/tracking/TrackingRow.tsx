"use client";

import { ChevronDown, ChevronRight, FlaskConical, Link2Off } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { JourneyStatusBadge, DeliveryOutcomeBadge } from "./DeliveryOutcomeBadge";
import { getJourneyStatus, type TrackingSubmission } from "@/hooks/tracking/useTrackingSubmissions";

const SERVICE_LABELS: Record<string, string> = {
  form: "Form",
  database: "Database",
  ghl_contact: "GHL",
  meta_capi: "Meta CAPI",
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function AttributionCell({ submission }: { submission: TrackingSubmission }) {
  const parts = [
    submission.utm_campaign || null,
    submission.fb_ad_id ? `ad ${submission.fb_ad_id.slice(-6)}` : null,
    submission.gclid ? `gclid ${submission.gclid.slice(-6)}` : null,
  ].filter(Boolean);

  return (
    <div className="text-xs">
      <div className="text-foreground">{submission.traffic_classification.replace(/_/g, " ")}</div>
      <div className="text-muted-foreground">{parts.length > 0 ? parts.join(" · ") : "—"}</div>
    </div>
  );
}

function Timeline({ submission }: { submission: TrackingSubmission }) {
  if (submission.events.length === 0) {
    return <p className="text-xs text-muted-foreground">No delivery events recorded.</p>;
  }

  return (
    <ol className="space-y-2">
      {submission.events.map((event) => (
        <li key={event.id} className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-foreground w-20">
            {SERVICE_LABELS[event.service] ?? event.service}
          </span>
          <DeliveryOutcomeBadge outcome={event.outcome} />
          <span className="text-muted-foreground">{event.operation}</span>
          {event.http_status != null && (
            <span className="text-muted-foreground">HTTP {event.http_status}</span>
          )}
          {event.meta_events_received != null && (
            <span className="text-muted-foreground">received {event.meta_events_received}</span>
          )}
          {event.duration_ms != null && (
            <span className="text-muted-foreground">{event.duration_ms}ms</span>
          )}
          {event.external_reference && (
            <span className="font-mono text-[11px] text-muted-foreground">
              {event.external_reference.slice(0, 8)}
            </span>
          )}
          {event.error_message && (
            <span className="text-destructive basis-full">{event.error_message}</span>
          )}
          <span className="text-muted-foreground ml-auto">{formatTime(event.created_at)}</span>
        </li>
      ))}
    </ol>
  );
}

interface TrackingRowProps {
  submission: TrackingSubmission;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function TrackingRow({ submission, isExpanded, onToggleExpand }: TrackingRowProps) {
  const status = getJourneyStatus(submission);
  const metaAccepted = submission.events.some((e) => e.service === "meta_capi" && e.outcome === "succeeded");

  return (
    <>
      <TableRow className="hover:bg-muted/40">
        <TableCell className="w-8">
          <button onClick={onToggleExpand} className="text-muted-foreground hover:text-foreground" aria-label="Toggle details">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </TableCell>
        <TableCell className="text-xs text-foreground whitespace-nowrap">
          {formatTime(submission.created_at)}
          {submission.is_internal_test && (
            <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-purple-500">
              <FlaskConical className="w-3 h-3" />
              test
            </span>
          )}
        </TableCell>
        <TableCell><JourneyStatusBadge status={status} /></TableCell>
        <TableCell>
          <AttributionCell submission={submission} />
        </TableCell>
        <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
          {submission.page_path || "—"}
        </TableCell>
        <TableCell className="text-xs">
          {submission.lead_id ? (
            <span className="text-green-600">linked</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Link2Off className="w-3 h-3" />
              unlinked
            </span>
          )}
        </TableCell>
        <TableCell className="text-xs">
          {submission.meta_event_id ? (
            metaAccepted ? (
              <span className="text-green-600">accepted</span>
            ) : (
              <span className="text-amber-600">not accepted</span>
            )
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow>
          <TableCell colSpan={7} className="bg-muted/20">
            <div className="space-y-3 py-2">
              <Timeline submission={submission} />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-[11px]">
                <Detail label="Submission ID" value={submission.id} mono />
                <Detail label="Lead ID" value={submission.lead_id || "not linked"} mono />
                <Detail label="Meta Event ID" value={submission.meta_event_id || "—"} mono />
                <Detail label="Form Status" value={submission.form_status} />
                <Detail label="Source" value={submission.source || "—"} />
                <Detail label="UTM Source" value={submission.utm_source || "—"} />
                <Detail label="UTM Term" value={submission.utm_term || "—"} />
                <Detail label="UTM ID" value={submission.utm_id || "—"} mono />
                <Detail label="FBC" value={submission.fbc || "—"} mono />
                <Detail label="FBP" value={submission.fbp || "—"} mono />
                <Detail label="FB Campaign ID" value={submission.fb_campaign_id || "—"} mono />
                <Detail label="FB Adset ID" value={submission.fb_adset_id || "—"} mono />
                <Detail label="FB Ad ID" value={submission.fb_ad_id || "—"} mono />
                <Detail label="FBCLID" value={submission.fbclid || "—"} mono />
                <Detail label="Idempotency Key" value={submission.idempotency_key || "—"} mono />
                <Detail label="Classified As" value={submission.traffic_classification.replace(/_/g, " ")} />
              </div>

              {metaAccepted && (
                <p className="text-[11px] text-muted-foreground">
                  Meta API accepted this event. This confirms API acceptance only — not campaign
                  attribution or Ads Manager reporting.
                </p>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className={mono ? "font-mono text-foreground break-all" : "text-foreground"}>{value}</span>
    </div>
  );
}
