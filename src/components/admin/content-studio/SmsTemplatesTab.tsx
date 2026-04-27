"use client";

import { useState, useEffect } from "react";
import { Fragment } from "react";
import { supabase } from "@/lib/supabase/client";
import { MARKETS } from "@/lib/data/markets";
import { SITUATIONS } from "@/lib/data/situations";
import { toast } from "sonner";
import { CheckCircle, Clock, RefreshCw, Loader2, Eye, EyeOff, MessageSquare } from "lucide-react";

const allMarkets = Object.keys(MARKETS);
const allSituations = Object.keys(SITUATIONS);

type TemplateInfo = { status: string; version: number; count: number };
type StatusMap = Map<string, TemplateInfo>;

export function SmsTemplatesTab() {
  const [statusMap, setStatusMap] = useState<StatusMap>(new Map());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<Set<string>>(new Set());
  const [publishing, setPublishing] = useState<Set<string>>(new Set());
  const [filterMarket, setFilterMarket] = useState("");
  const [filterSituation, setFilterSituation] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sms_templates")
        .select("market_slug, situation_slug, status, version, step")
        .order("version", { ascending: false });

      if (error) {
        toast.error("Failed to load SMS template status");
        return;
      }

      const map = new Map<string, TemplateInfo>();
      for (const r of data || []) {
        const key = `${r.market_slug}::${r.situation_slug}`;
        if (!map.has(key)) {
          map.set(key, { status: r.status, version: r.version, count: 0 });
        }
        const info = map.get(key)!;
        if (r.version === info.version) info.count++;
      }
      setStatusMap(map);
    } catch (err: any) {
      console.error("fetchStatus error:", err);
      toast.error("Failed to load SMS template status: " + err.message);
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
      const { error } = await supabase.functions.invoke("generate-sms-templates", {
        body: {
          market_slug: marketSlug,
          situation_slug: situationSlug,
          market_name: market?.name || marketSlug,
          situation_label: situation?.label || situationSlug,
        },
      });
      if (error) throw error;
      await fetchStatus();
      toast.success(`SMS templates generated: ${market?.name} × ${situation?.label}`);
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
        .from("sms_templates")
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
      toast.success(`${newStatus === "published" ? "Published" : "Unpublished"} SMS templates`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setPublishing((prev) => { const next = new Set(prev); next.delete(key); return next; });
    }
  };

  const loadTemplates = async (marketSlug: string, situationSlug: string) => {
    const key = `${marketSlug}::${situationSlug}`;
    if (expandedKey === key) { setExpandedKey(null); return; }
    const info = statusMap.get(key);
    if (!info) return;
    try {
      const { data, error } = await supabase
        .from("sms_templates")
        .select("*")
        .eq("market_slug", marketSlug)
        .eq("situation_slug", situationSlug)
        .eq("version", info.version)
        .order("step", { ascending: true });
      if (error) throw error;
      setTemplates(data || []);
      setExpandedKey(key);
    } catch (err: any) {
      console.error("loadTemplates error:", err);
      toast.error("Failed to load templates: " + err.message);
    }
  };

  const generatedCount = statusMap.size;
  const filteredMarkets = filterMarket ? [filterMarket] : allMarkets;
  const filteredSituations = filterSituation ? [filterSituation] : allSituations;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {generatedCount} market×situation combos have SMS templates
        </p>
        <button onClick={fetchStatus} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
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
                <th className="text-center px-4 py-2 font-medium text-muted-foreground">Templates</th>
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
                  const isExpanded = expandedKey === key;
                  return (
                     <Fragment key={key}>
                      <tr key={key} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => info && loadTemplates(m, s)}>
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
                            <span className="inline-flex items-center gap-1 text-muted-foreground text-xs"><Clock className="w-3.5 h-3.5" /> None</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center text-xs text-muted-foreground">{info ? `${info.count} (v${info.version})` : "—"}</td>
                        <td className="px-4 py-2 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                          {info && (
                            <button onClick={() => togglePublish(m, s)} disabled={isPublishing} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border border-border hover:bg-muted transition-colors disabled:opacity-50">
                              {isPublishing ? <Loader2 className="w-3 h-3 animate-spin" /> : info.status === "published" ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              {info.status === "published" ? "Unpublish" : "Publish"}
                            </button>
                          )}
                          <button onClick={() => triggerGenerate(m, s)} disabled={isGenerating} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border border-border hover:bg-muted transition-colors disabled:opacity-50">
                            {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3" />}
                            {info ? "Regenerate" : "Generate"}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && templates.length > 0 && (
                        <tr key={`${key}-detail`} className="bg-muted/20">
                          <td colSpan={5} className="px-6 py-3">
                            <div className="space-y-2">
                              {templates.map((t) => (
                                <div key={t.id} className="flex items-start gap-3 p-2 rounded bg-background border border-border">
                                  <span className="text-xs font-medium text-primary min-w-[60px]">Step {t.step}</span>
                                  <p className="text-sm text-foreground">{t.message_text}</p>
                                  <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">{t.message_text.length} chars</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
