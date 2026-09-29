"use client";

import type { TrackingSubmission } from "@/hooks/tracking/useTrackingSubmissions";

const columns: Array<[string, (submission: TrackingSubmission) => string | number | null]> = [
  ["Submitted at", (s) => s.created_at],
  ["Form status", (s) => s.form_status],
  ["Traffic classification", (s) => s.traffic_classification],
  ["Source", (s) => s.source],
  ["Page path", (s) => s.page_path],
  ["Lead ID", (s) => s.lead_id],
  ["Meta event ID", (s) => s.meta_event_id],
  ["FBCLID", (s) => s.fbclid],
  ["FBC", (s) => s.fbc],
  ["FBP", (s) => s.fbp],
  ["Meta campaign ID", (s) => s.fb_campaign_id],
  ["Meta ad set ID", (s) => s.fb_adset_id],
  ["Meta ad ID", (s) => s.fb_ad_id],
  ["UTM source", (s) => s.utm_source],
  ["UTM medium", (s) => s.utm_medium],
  ["UTM campaign", (s) => s.utm_campaign],
  ["GCLID", (s) => s.gclid],
  ["GBRAID", (s) => s.gbraid],
  ["WBRAID", (s) => s.wbraid],
  ["MSCLKID", (s) => s.msclkid],
  ["Delivery events", (s) => s.events.map((event) => `${event.service}:${event.outcome}`).join("; ")],
];

function rows(submissions: TrackingSubmission[]) {
  return submissions.map((submission) => Object.fromEntries(columns.map(([header, value]) => [header, value(submission) ?? ""])));
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportTrackingCsv(submissions: TrackingSubmission[]) {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const data = rows(submissions);
  const csv = [columns.map(([header]) => escape(header)).join(","), ...data.map((row) => columns.map(([header]) => escape(String(row[header]))).join(","))].join("\n");
  download(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }), "submission-tracking.csv");
}

export async function exportTrackingXlsx(submissions: TrackingSubmission[]) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows(submissions)), "Submission tracking");
  const output = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  download(new Blob([output], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "submission-tracking.xlsx");
}
