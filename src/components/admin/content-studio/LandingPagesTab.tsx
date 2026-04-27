"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { MARKETS } from "@/lib/data/markets";
import { SITUATIONS } from "@/lib/data/situations";
import { toast } from "sonner";
import { CheckCircle, Clock, RefreshCw, Loader2, Eye, EyeOff } from "lucide-react";

const allMarkets = Object.keys(MARKETS);
const allSituations = Object.keys(SITUATIONS);

type ContentStatus = { status: string; version: number };
type StatusMap = Map<string, ContentStatus>;

export function LandingPagesTab() {
  const [statusMap, setStatusMap] = useState<StatusMap>(new Map());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<Set<string>>(new Set());
  const [publishing, setPublishing] = useState<Set<string>>(new Set());
  const [filterMarket, setFilterMarket] = useState("");
  const [filterSituation, setFilterSituation] = useState("");
  const [bulkRunning, setBulkRunning] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("generated_content")
        .select("market_slug, situation_slug, status, version")
        .order("version", { ascending: false });

      if (error) {
        toast.error("Failed to load content status");
        return;
      }

      const map = new Map<string, ContentStatus>();
      for (const r of data || []) {
        const key = `${r.market_slug}::${r.situation_slug}`;
        if (!map.has(key)) {
          map.set(key, { status: r.status as string, version: r.version as number });
        }
      }
      setStatusMap(map);
    } catch (err: any) {
      console.error("fetchStatus error:", err);
      toast.error("Failed to load content status: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const triggerGenerate = async (marketSlug: string, situationSlug: string) => {
    const key = `${marketSlug}::${situationSlug}`;
    setGenerating((prev) => new Set(prev).add(key));
    try {
      const market = MARKETS[marketSlug];
      const situation = SITUATIONS[situationSlug];
      const { error } = await supabase.functions.invoke("generate-content", {
        body: {
          market_slug: marketSlug,
          market_name: market?.name || marketSlug,
          market_state: market?.state || "",
          market_state_full: market?.stateFullName || "",
          service_areas: market?.serviceAreas || [],
          situation_slug: situationSlug,
          situation_label: situation?.label || situationSlug,
          situation_description: situation?.bodyParagraphs?.[0] || situation?.label || "",
        },
      });
      if (error) throw error;
      await fetchStatus();
      toast.success(`Generated: ${MARKETS[marketSlug]?.name} × ${SITUATIONS[situationSlug]?.label}`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed: ${marketSlug} × ${situationSlug}`);
    } finally {
      setGenerating((prev) => { const next = new Set(prev); next.delete(key); return next; });
    }
  };

  const togglePublish = async (marketSlug: string, situationSlug: string) => {
    const key = `${marketSlug}::${situationSlug}`;
    const current = statusMap.get(key);
    if (!current) return;
    const newStatus = current.status === "published" ? "draft" : "published";
    setPublishing((prev) => new Set(prev).add(key));
    try {
      const { error } = await supabase
        .from("generated_content")
        .update({ status: newStatus })
        .eq("market_slug", marketSlug)
        .eq("situation_slug", situationSlug)
        .eq("version", current.version);
      if (error) throw error;
      setStatusMap((prev) => {
        const next = new Map(prev);
        next.set(key, { ...current, status: newStatus });
        return next;
      });
      toast.success(`${newStatus === "published" ? "Published" : "Unpublished"}: ${MARKETS[marketSlug]?.name} × ${SITUATIONS[situationSlug]?.label}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setPublishing((prev) => { const next = new Set(prev); next.delete(key); return next; });
    }
  };

  const generateAllMissing = async () => {
    setBulkRunning(true);
    const missing: Array<[string, string]> = [];
    for (const m of allMarkets) {
      for (const s of allSituations) {
        if (!statusMap.has(`${m}::${s}`)) missing.push([m, s]);
      }
    }
    toast.info(`Starting generation for ${missing.length} pages...`);
    for (const [m, s] of missing) {
      await triggerGenerate(m, s);
      await new Promise((r) => setTimeout(r, 2000));
    }
    setBulkRunning(false);
    toast.success("Bulk generation complete!");
  };

  const totalCombos = allMarkets.length * allSituations.length;
  const generatedCount = statusMap.size;
  const publishedCount = Array.from(statusMap.values()).filter(v => v.status === "published").length;
  const pendingCount = totalCombos - generatedCount;

  const filteredMarkets = filterMarket ? [filterMarket] : allMarkets;
  const filteredSituations = filterSituation ? [filterSituation] : allSituations;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {generatedCount} generated · {publishedCount} published · {pendingCount} pending
        </p>
        <div className="flex items-center gap-3">
          <button onClick={fetchStatus} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button onClick={generateAllMissing} disabled={bulkRunning || pendingCount === 0} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 disabled:opacity-50">
            {bulkRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {bulkRunning ? "Generating..." : `Generate All Missing (${pendingCount})`}
          </button>
        </div>
      </div>

      <div className="w-full bg-muted rounded-full h-3">
        <div className="bg-primary h-3 rounded-full transition-all duration-500" style={{ width: `${(generatedCount / totalCombos) * 100}%` }} />
      </div>

      <div className="flex gap-3">
        <select value={filterMarket} onChange={(e) => setFilterMarket(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">All Markets ({allMarkets.length})</option>
          {allMarkets.map((m) => <option key={m} value={m}>{MARKETS[m]?.name}</option>)}
        </select>
        <select value={filterSituation} onChange={(e) => setFilterSituation(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">All Situations ({allSituations.length})</option>
          {allSituations.map((s) => <option key={s} value={s}>{SITUATIONS[s]?.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Market</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Situation</th>
                <th className="text-center px-4 py-2 font-medium text-muted-foreground">Status</th>
                <th className="text-center px-4 py-2 font-medium text-muted-foreground">Ver</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMarkets.flatMap((m) =>
                filteredSituations.map((s) => {
                  const key = `${m}::${s}`;
                  const info = statusMap.get(key);
                  const isGenerating = generating.has(key);
                  const isPublishing = publishing.has(key);
                  return (
                    <tr key={key} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2 text-foreground">{MARKETS[m]?.name}</td>
                      <td className="px-4 py-2 text-foreground">{SITUATIONS[s]?.label}</td>
                      <td className="px-4 py-2 text-center">
                        {info ? (
                          info.status === "published" ? (
                            <span className="inline-flex items-center gap-1 text-green-500 text-xs font-medium"><CheckCircle className="w-3.5 h-3.5" /> Published</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-yellow-500 text-xs font-medium"><Eye className="w-3.5 h-3.5" /> Draft</span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground text-xs"><Clock className="w-3.5 h-3.5" /> Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center text-xs text-muted-foreground">{info ? `v${info.version}` : "—"}</td>
                      <td className="px-4 py-2 text-right space-x-2">
                        {info && (
                          <button onClick={() => togglePublish(m, s)} disabled={isPublishing} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border border-border hover:bg-muted transition-colors disabled:opacity-50">
                            {isPublishing ? <Loader2 className="w-3 h-3 animate-spin" /> : info.status === "published" ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {info.status === "published" ? "Unpublish" : "Publish"}
                          </button>
                        )}
                        <button onClick={() => triggerGenerate(m, s)} disabled={isGenerating} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border border-border hover:bg-muted transition-colors disabled:opacity-50">
                          {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          {info ? "Regenerate" : "Generate"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
