"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PerfRow {
  id: string;
  market_slug: string;
  situation_slug: string;
  measured_at: string;
  unique_sessions: number;
  leads_count: number;
  conversion_rate: number;
  wilson_lower_bound: number;
  performance_tier: string | null;
  regenerated: boolean;
  ai_confidence_score: number | null;
  auto_published: boolean;
  notes: string | null;
}

const tierBadge = (tier: string | null) => {
  switch (tier) {
    case "top": return <Badge className="bg-primary/20 text-primary border-primary/30">🏆 Top</Badge>;
    case "underperformer": return <Badge variant="destructive">📉 Bottom</Badge>;
    case "mid": return <Badge variant="secondary">Mid</Badge>;
    case "insufficient_data": return <Badge variant="outline">Need data</Badge>;
    default: return null;
  }
};

export default function PerformanceLoopTab() {
  const [rows, setRows] = useState<PerfRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    // Latest snapshot per (market, situation): use a 24h window of measurements
    const since = new Date(Date.now() - 7 * 86400_000).toISOString();
    const { data, error } = await supabase
      .from("content_performance")
      .select("*")
      .gte("measured_at", since)
      .order("wilson_lower_bound", { ascending: true })
      .limit(200);
    if (error) {
      toast.error("Failed to load performance data: " + error.message);
    } else {
      // Dedupe — keep most recent per (market, situation)
      const seen = new Set<string>();
      const unique: PerfRow[] = [];
      const sorted = [...(data ?? [])].sort((a, b) => +new Date(b.measured_at) - +new Date(a.measured_at));
      for (const r of sorted) {
        const key = `${r.market_slug}|${r.situation_slug}`;
        if (!seen.has(key)) { seen.add(key); unique.push(r); }
      }
      setRows(unique);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runNow = async (dryRun: boolean) => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("content-loop-nightly", {
        body: { dry_run: dryRun },
      });
      if (error) throw error;
      toast.success(
        dryRun
          ? `Dry run complete — ${data?.summary?.bottom ?? 0} underperformers identified`
          : `Loop complete — ${data?.summary?.auto_published ?? 0} pages auto-published, ${data?.summary?.kept_as_draft ?? 0} kept as drafts`,
      );
      await load();
    } catch (e) {
      toast.error("Loop failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setRunning(false);
    }
  };

  const top = rows.filter(r => r.performance_tier === "top");
  const bottom = rows.filter(r => r.performance_tier === "underperformer");
  const insufficient = rows.filter(r => r.performance_tier === "insufficient_data");

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
            <Button variant="outline" onClick={() => runNow(true)} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : "Dry run"}
            </Button>
            <Button onClick={() => runNow(false)} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run loop now"}
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
          {rows.map(r => (
            <tr key={r.id} className="border-b border-border/40">
              <td className="py-2 pr-4 font-mono text-xs">{r.market_slug} / {r.situation_slug}</td>
              <td className="text-right pr-4">{r.unique_sessions}</td>
              <td className="text-right pr-4">{r.leads_count}</td>
              <td className="text-right pr-4 font-medium">{(r.conversion_rate * 100).toFixed(2)}%</td>
              <td className="text-right pr-4 text-muted-foreground">{(r.wilson_lower_bound * 100).toFixed(2)}%</td>
              <td className="pr-4">
                {r.regenerated ? (
                  <span className="flex items-center gap-1.5">
                    <Badge variant={r.auto_published ? "default" : "secondary"} className="text-xs">
                      {r.auto_published ? "Published" : "Draft"}
                    </Badge>
                    {r.ai_confidence_score !== null && (
                      <span className="text-xs text-muted-foreground">AI {r.ai_confidence_score}/10</span>
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
