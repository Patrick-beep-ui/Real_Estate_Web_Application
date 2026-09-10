"use client";

import type { Lead } from "@/lib/leads/types";
import { getTrafficSourceLabel } from "@/lib/tracking/traffic-source";

type ColumnDef = {
  header: string;
  accessor: (lead: Lead) => unknown;
};

export const EXPORT_COLUMNS: ColumnDef[] = [
  { header: "Name", accessor: (l) => l.name },
  { header: "Phone", accessor: (l) => l.phone },
  { header: "Email", accessor: (l) => l.email },
  { header: "Property Address", accessor: (l) => l.property_address },
  { header: "Market", accessor: (l) => l.market_slug },
  { header: "Situation", accessor: (l) => l.situation_slug },
  { header: "Page Source", accessor: (l) => l.source },
  { header: "Platform Source", accessor: (l) => getTrafficSourceLabel(l) },
  { header: "Timeline to Sell", accessor: (l) => (l as any).timeline_to_sell ?? null },
  { header: "Listed with Agent", accessor: (l) => (l as any).listed_with_agent ?? null },
  { header: "Property Age", accessor: (l) => (l as any).property_age ?? null },
  { header: "Market Price", accessor: (l) => (l as any).market_price ?? null },
  { header: "Lowest Price", accessor: (l) => (l as any).lowest_price ?? null },
  { header: "Timezone", accessor: (l) => l.tz_browser ?? l.tz_ip ?? null },
  { header: "Page Path", accessor: (l) => l.page_path },
  { header: "UTM Source", accessor: (l) => l.utm_source },
  { header: "UTM Medium", accessor: (l) => l.utm_medium },
  { header: "UTM Campaign", accessor: (l) => l.utm_campaign },
  { header: "GCLID", accessor: (l) => l.gclid },
  { header: "GBRAID", accessor: (l) => l.gbraid },
  { header: "WBRAID", accessor: (l) => l.wbraid },
  { header: "Created At", accessor: (l) => l.created_at },
  { header: "Consent Transactional", accessor: (l) => (l as any).consent_transactional ?? null },
  { header: "Consent Promotional", accessor: (l) => (l as any).consent_promotional ?? null },
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

export function exportToCsv(leads: Lead[], filename?: string) {
  const name = filename ?? `leads-data-${todayStr()}.csv`;
  const headerRow = EXPORT_COLUMNS.map((c) => escapeCsv(c.header)).join(",");
  const dataRows = leads.map((lead) =>
    EXPORT_COLUMNS.map((c) => escapeCsv(c.accessor(lead))).join(",")
  );
  const bom = "\uFEFF";
  const csv = bom + headerRow + "\n" + dataRows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToXlsx(leads: Lead[], filename?: string) {
  const name = filename ?? `leads-data-${todayStr()}.xlsx`;
  const rows = leads.map((lead) => {
    const row: Record<string, unknown> = {};
    for (const col of EXPORT_COLUMNS) {
      row[col.header] = col.accessor(lead) ?? null;
    }
    return row;
  });
  import("xlsx").then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const colWidths = EXPORT_COLUMNS.map((c) => ({
      wch: Math.max(c.header.length, 12),
    }));
    ws["!cols"] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}
