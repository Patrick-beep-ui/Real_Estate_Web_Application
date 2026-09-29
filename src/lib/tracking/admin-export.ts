"use client";

import { getJourneyStatus, type TrackingSubmission, type DeliveryRow } from "@/hooks/tracking/useTrackingSubmissions";

type ColumnDef = {
  header: string;
  accessor: (submission: TrackingSubmission) => unknown;
};

type DeliveryColumnDef = {
  header: string;
  accessor: (row: DeliveryRow & { submission: TrackingSubmission }) => unknown;
};

function metaAccepted(submission: TrackingSubmission): boolean {
  return submission.events.some((e) => e.service === "meta_capi" && e.outcome === "succeeded");
}

function metaStarted(submission: TrackingSubmission): boolean {
  return submission.events.some((e) => e.service === "meta_capi" && e.outcome === "started");
}

/**
 * One row per submission — the "did this lead complete the journey" view.
 * Contains no PII: the audit tables intentionally never store name/phone/email.
 */
export const JOURNEY_COLUMNS: ColumnDef[] = [
  { header: "Submission ID", accessor: (s) => s.id },
  { header: "Created At", accessor: (s) => s.created_at },
  { header: "Journey Status", accessor: (s) => getJourneyStatus(s) },
  { header: "Form Status", accessor: (s) => s.form_status },
  { header: "Traffic Classification", accessor: (s) => s.traffic_classification },
  { header: "Internal Test", accessor: (s) => s.is_internal_test },
  { header: "Lead Linked", accessor: (s) => Boolean(s.lead_id) },
  { header: "Lead ID", accessor: (s) => s.lead_id },
  { header: "Page Source", accessor: (s) => s.source },
  { header: "Page Path", accessor: (s) => s.page_path },
  { header: "UTM Source", accessor: (s) => s.utm_source },
  { header: "UTM Medium", accessor: (s) => s.utm_medium },
  { header: "UTM Campaign", accessor: (s) => s.utm_campaign },
  { header: "UTM Content", accessor: (s) => s.utm_content },
  { header: "UTM Term", accessor: (s) => s.utm_term },
  { header: "UTM ID", accessor: (s) => s.utm_id },
  { header: "FBCLID", accessor: (s) => s.fbclid },
  { header: "FBC", accessor: (s) => s.fbc },
  { header: "FBP", accessor: (s) => s.fbp },
  { header: "FB Campaign ID", accessor: (s) => s.fb_campaign_id },
  { header: "FB Adset ID", accessor: (s) => s.fb_adset_id },
  { header: "FB Ad ID", accessor: (s) => s.fb_ad_id },
  { header: "GCLID", accessor: (s) => s.gclid },
  { header: "MSCLKID", accessor: (s) => s.msclkid },
  { header: "Meta Event ID", accessor: (s) => s.meta_event_id },
  { header: "Meta Accepted By API", accessor: metaAccepted },
  { header: "Meta Event Dispatched", accessor: metaStarted },
  { header: "Delivery Event Count", accessor: (s) => s.events.length },
];

/** One row per delivery attempt — the per-step detail view for reconciliation. */
export const DELIVERY_COLUMNS: DeliveryColumnDef[] = [
  { header: "Submission ID", accessor: (r) => r.submission_id },
  { header: "Submission Created At", accessor: (r) => r.submission.created_at },
  { header: "Event Created At", accessor: (r) => r.created_at },
  { header: "Service", accessor: (r) => r.service },
  { header: "Operation", accessor: (r) => r.operation },
  { header: "Outcome", accessor: (r) => r.outcome },
  { header: "Attempt", accessor: (r) => r.attempt_number },
  { header: "Duration (ms)", accessor: (r) => r.duration_ms },
  { header: "HTTP Status", accessor: (r) => r.http_status },
  { header: "External Reference", accessor: (r) => r.external_reference },
  { header: "Meta Event ID", accessor: (r) => r.meta_event_id },
  { header: "Meta Events Received", accessor: (r) => r.meta_events_received },
  { header: "Error Code", accessor: (r) => r.error_code },
  { header: "Error Message", accessor: (r) => r.error_message },
  { header: "Internal Test", accessor: (r) => r.submission.is_internal_test },
  { header: "Traffic Classification", accessor: (r) => r.submission.traffic_classification },
  { header: "FB Ad ID", accessor: (r) => r.submission.fb_ad_id },
];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildCsv(headers: string[], rows: unknown[][]): string {
  const headerRow = headers.map(escapeCsv).join(",");
  const dataRows = rows.map((row) => row.map(escapeCsv).join(","));
  return "\uFEFF" + headerRow + "\n" + dataRows.join("\n");
}

export function exportJourneyCsv(submissions: TrackingSubmission[], filename?: string) {
  const name = filename ?? `tracking-journeys-${todayStr()}.csv`;
  const rows = submissions.map((s) => JOURNEY_COLUMNS.map((c) => c.accessor(s)));
  download(new Blob([buildCsv(JOURNEY_COLUMNS.map((c) => c.header), rows)], { type: "text/csv;charset=utf-8" }), name);
}

export function exportJourneyXlsx(submissions: TrackingSubmission[], filename?: string) {
  const name = filename ?? `tracking-journeys-${todayStr()}.xlsx`;
  const rows = submissions.map((s) => {
    const row: Record<string, unknown> = {};
    for (const col of JOURNEY_COLUMNS) row[col.header] = col.accessor(s) ?? null;
    return row;
  });
  import("xlsx").then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = JOURNEY_COLUMNS.map((c) => ({ wch: Math.max(c.header.length, 12) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Journeys");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    download(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), name);
  });
}

function flattenDeliveryEvents(submissions: TrackingSubmission[]) {
  const rows: Array<DeliveryRow & { submission: TrackingSubmission }> = [];
  for (const submission of submissions) {
    for (const event of submission.events) rows.push({ ...event, submission });
  }
  return rows;
}

export function exportDeliveryEventsCsv(submissions: TrackingSubmission[], filename?: string) {
  const name = filename ?? `tracking-delivery-events-${todayStr()}.csv`;
  const rows = flattenDeliveryEvents(submissions).map((r) => DELIVERY_COLUMNS.map((c) => c.accessor(r)));
  download(new Blob([buildCsv(DELIVERY_COLUMNS.map((c) => c.header), rows)], { type: "text/csv;charset=utf-8" }), name);
}

export function exportDeliveryEventsXlsx(submissions: TrackingSubmission[], filename?: string) {
  const name = filename ?? `tracking-delivery-events-${todayStr()}.xlsx`;
  const rows = flattenDeliveryEvents(submissions).map((r) => {
    const row: Record<string, unknown> = {};
    for (const col of DELIVERY_COLUMNS) row[col.header] = col.accessor(r) ?? null;
    return row;
  });
  import("xlsx").then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = DELIVERY_COLUMNS.map((c) => ({ wch: Math.max(c.header.length, 12) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Delivery Events");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    download(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), name);
  });
}
