"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Sparkles, AlertCircle } from "lucide-react";

interface PerfRow {
  id: string;
  marketSlug: string;
  situationSlug: string;
  measuredAt: string;
  uniqueSessions: number;
  leadsCount: number;
  conversionRate: number;
  wilsonLowerBound: number;
  performanceTier: string | null;
  regenerated: boolean;
  aiConfidenceScore: number | null;
  autoPublished: boolean;
  notes: string | null;
}

type PerformanceResponse = { items: PerfRow[] };

export default function PerformanceLoopTab() {
  const { data, isLoading: loading } = useQuery({
    queryKey: ["admin-content", "performance"],
    queryFn: () => adminApi.get<PerformanceResponse>("/api/admin/content/performance"),
  });
  const rows = data?.items ?? [];

  const top = rows.filter((row) => row.performanceTier === "top");
  const bottom = rows.filter((row) => row.performanceTier === "underperformer");
  const insufficient = rows.filter((row) => row.performanceTier === "insufficient_data");

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Self-Improving Content Loop
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Runs nightly at 3am UTC. Ranks every landing page by Wilson lower-bound conversion rate (handles small samples correctly),
              regenerates the bottom 25% with prompts enriched by what the top 25% are doing, and AI self-critiques the new copy.
              Only versions scoring ≥8/10 auto-publish — the rest stay as drafts.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled title="Performance loop backend unavailable">
              Dry run unavailable
            </Button>
            <Button disabled title="Performance loop backend unavailable">
              Run unavailable
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground">Total measured</div>
            <div className="text-2xl font-bold">{rows.length}</div>
          </div>
          <div className="rounded-lg bg-primary/10 p-3 border border-primary/20">
            <div className="text-xs text-primary">Top performers</div>
            <div className="text-2xl font-bold text-primary">{top.length}</div>
          </div>
          <div className="rounded-lg bg-destructive/10 p-3 border border-destructive/20">
            <div className="text-xs text-destructive">Underperformers</div>
            <div className="text-2xl font-bold text-destructive">{bottom.length}</div>
          </div>
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground">Insufficient data</div>
            <div className="text-2xl font-bold">{insufficient.length}</div>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <Card className="p-12 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No performance data yet. Run a dry run to seed the snapshot, or wait for traffic to accumulate.</p>
        </Card>
      ) : (
        <>
          {bottom.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <TrendingDown className="h-5 w-5 text-destructive" />
                Underperformers (regenerate candidates)
              </h3>
              <PerfTable rows={bottom} />
            </Card>
          )}
          {top.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                Top performers (used as winning examples in the loop)
              </h3>
              <PerfTable rows={top} />
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function PerfTable({ rows }: { rows: PerfRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-muted-foreground border-b border-border">
          <tr>
            <th className="text-left py-2 pr-4">Page</th>
            <th className="text-right py-2 pr-4">Sessions</th>
            <th className="text-right py-2 pr-4">Leads</th>
            <th className="text-right py-2 pr-4">CR</th>
            <th className="text-right py-2 pr-4">Wilson LB</th>
            <th className="text-left py-2 pr-4">Last regen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border/40">
              <td className="py-2 pr-4 font-mono text-xs">{r.marketSlug} / {r.situationSlug}</td>
              <td className="text-right pr-4">{r.uniqueSessions}</td>
              <td className="text-right pr-4">{r.leadsCount}</td>
              <td className="text-right pr-4 font-medium">{(r.conversionRate * 100).toFixed(2)}%</td>
              <td className="text-right pr-4 text-muted-foreground">{(r.wilsonLowerBound * 100).toFixed(2)}%</td>
              <td className="pr-4">
                {r.regenerated ? (
                  <span className="flex items-center gap-1.5">
                    <Badge variant={r.autoPublished ? "default" : "secondary"} className="text-xs">
                      {r.autoPublished ? "Published" : "Draft"}
                    </Badge>
                    {r.aiConfidenceScore !== null && (
                      <span className="text-xs text-muted-foreground">AI {r.aiConfidenceScore}/10</span>
                    )}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
