"use client";

import { AlertTriangle, Database, Globe, Wifi, CheckCircle2 } from "lucide-react";
import type { LeadErrorStats } from "@/hooks/useLeadErrors";

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <div className="text-xl font-bold text-foreground">{value}</div>
    </div>
  );
}

interface LeadErrorStatsCardsProps {
  stats: LeadErrorStats;
}

export function LeadErrorStatsCards({ stats }: LeadErrorStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
      <StatCard label="Total Errors" value={stats.total.toString()} icon={<AlertTriangle className="w-4 h-4 text-destructive" />} />
      <StatCard label="Active" value={stats.active.toString()} icon={<AlertTriangle className="w-4 h-4 text-destructive" />} />
      <StatCard label="Database" value={stats.db.toString()} icon={<Database className="w-4 h-4 text-red-400" />} />
      <StatCard label="GHL API" value={stats.ghlApi.toString()} icon={<Globe className="w-4 h-4 text-orange-400" />} />
      <StatCard label="GHL Network" value={stats.ghlFetch.toString()} icon={<Wifi className="w-4 h-4 text-amber-400" />} />
      <StatCard label="Resolved" value={stats.resolved.toString()} icon={<CheckCircle2 className="w-4 h-4 text-green-400" />} />
    </div>
  );
}
