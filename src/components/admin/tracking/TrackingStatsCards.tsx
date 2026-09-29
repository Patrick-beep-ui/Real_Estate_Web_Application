"use client";

import { AlertTriangle, CheckCircle2, Clock, FlaskConical, Radio, Ban } from "lucide-react";
import type { TrackingStats } from "@/hooks/tracking/useTrackingSubmissions";

function StatCard({ label, value, icon, hint }: { label: string; value: string; icon: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <div className="text-xl font-bold text-foreground">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

interface TrackingStatsCardsProps {
  stats: TrackingStats;
}

export function TrackingStatsCards({ stats }: TrackingStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard label="Journeys" value={String(stats.total)} icon={<Clock className="w-4 h-4 text-muted-foreground" />} />
      <StatCard
        label="Complete"
        value={String(stats.complete)}
        icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
        hint="DB + GHL + CAPI"
      />
      <StatCard
        label="Partial / Unlinked"
        value={String(stats.partial)}
        icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
        hint="Missing step or lead link"
      />
      <StatCard
        label="Failed"
        value={String(stats.failed)}
        icon={<Ban className="w-4 h-4 text-destructive" />}
        hint="A step returned failure"
      />
      <StatCard
        label="Meta Accepted"
        value={String(stats.metaAccepted)}
        icon={<Radio className="w-4 h-4 text-blue-400" />}
        hint="Accepted by Meta API"
      />
      <StatCard
        label="Internal Tests"
        value={String(stats.internalTests)}
        icon={<FlaskConical className="w-4 h-4 text-purple-400" />}
        hint="Excluded from campaign reporting"
      />
    </div>
  );
}
