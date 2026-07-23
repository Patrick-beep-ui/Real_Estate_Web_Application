"use client";

import { DollarSign } from "lucide-react";

function StatCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
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

type Stats = {
  totalLeads: number;
  closedLeads: { length: number };
  totalRevenue: number;
  conversionRate: string;
  googleAdsLeads: number;
  metaAdsLeads: number;
};

export function LeadStatsCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard label="Total Leads" value={stats.totalLeads.toString()} />
      <StatCard label="Closed Deals" value={stats.closedLeads.length.toString()} />
      <StatCard label="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} icon={<DollarSign className="w-4 h-4 text-green-400" />} />
      <StatCard label="Conversion Rate" value={`${stats.conversionRate}%`} />
      <StatCard label="Google Ads" value={stats.googleAdsLeads.toString()} icon={<div className="w-3 h-3 rounded-sm bg-green-500" />} />
      <StatCard label="Meta Ads" value={stats.metaAdsLeads.toString()} icon={<div className="w-3 h-3 rounded-sm bg-indigo-500" />} />
    </div>
  );
}
