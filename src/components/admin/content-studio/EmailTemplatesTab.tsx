"use client";

import { Fragment, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/api";
import { MARKETS } from "@/lib/data/markets";
import { SITUATIONS } from "@/lib/data/situations";
import { toast } from "sonner";
import { CheckCircle, Clock, RefreshCw, Loader2, Eye, EyeOff, Mail } from "lucide-react";

const allMarkets = Object.keys(MARKETS);
const allSituations = Object.keys(SITUATIONS);

type TemplateInfo = { status: string; version: number; count: number };
type StatusMap = Map<string, TemplateInfo>;
type TemplateStatusResponse = {
  items: Array<{ marketSlug: string; situationSlug: string; status: string; version: number; count: number }>;
};
type EmailTemplateResponse = {
  items: Array<{ id: string; step: number; subject: string; previewText: string | null; bodyText: string | null }>;
};

export function EmailTemplatesTab() {
  const queryClient = useQueryClient();
  const [publishing, setPublishing] = useState<Set<string>>(new Set());
  const [filterMarket, setFilterMarket] = useState("");
  const [filterSituation, setFilterSituation] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ marketSlug: string; situationSlug: string; version: number } | null>(null);

  const { data, isLoading: loading, isFetching, refetch } = useQuery({
    queryKey: ["admin-content", "email-templates"],
    queryFn: () => adminApi.get<TemplateStatusResponse>("/api/admin/content/email-templates"),
  });

  const { data: templateData } = useQuery({
    queryKey: ["admin-content", "email-templates", selected?.marketSlug, selected?.situationSlug, selected?.version],
    queryFn: () =>
      adminApi.get<EmailTemplateResponse>(
        `/api/admin/content/email-templates/${selected!.marketSlug}/${selected!.situationSlug}?version=${selected!.version}`,
      ),
    enabled: selected !== null,
  });

  const updateStatus = useMutation({
    mutationFn: (input: { marketSlug: string; situationSlug: string; version: number; status: "draft" | "published" }) =>
      adminApi.patch("/api/admin/content/email-templates", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-content", "email-templates"] }),
  });

  const statusMap: StatusMap = new Map(
    (data?.items ?? []).map((item) => [
      `${item.marketSlug}::${item.situationSlug}`,
      { status: item.status, version: item.version, count: item.count },
    ]),
  );
  const templates = templateData?.items ?? [];

  const togglePublish = async (marketSlug: string, situationSlug: string) => {
    const key = `${marketSlug}::${situationSlug}`;
    const current = statusMap.get(key);
    if (!current) return;
    const newStatus = current.status === "published" ? "draft" : "published";
    setPublishing((prev) => new Set(prev).add(key));
    try {
      await updateStatus.mutateAsync({ marketSlug, situationSlug, version: current.version, status: newStatus });
      toast.success(`${newStatus === "published" ? "Published" : "Unpublished"} email templates`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setPublishing((prev) => { const next = new Set(prev); next.delete(key); return next; });
    }
  };

  const loadTemplates = (marketSlug: string, situationSlug: string) => {
    const key = `${marketSlug}::${situationSlug}`;
    if (expandedKey === key) {
      setExpandedKey(null);
      setSelected(null);
      return;
    }
    const info = statusMap.get(key);
    if (!info) return;
    setSelected({ marketSlug, situationSlug, version: info.version });
    setExpandedKey(key);
  };

  const generatedCount = statusMap.size;
  const filteredMarkets = filterMarket ? [filterMarket] : allMarkets;
  const filteredSituations = filterSituation ? [filterSituation] : allSituations;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {generatedCount} market×situation combos have email sequences
        </p>
        <button onClick={() => refetch()} disabled={isFetching} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
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
                <th className="text-center px-4 py-2 font-medium text-muted-foreground">Emails</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMarkets.flatMap((m) =>
                filteredSituations.map((s) => {
                  const key = `${m}::${s}`;
                  const info = statusMap.get(key);
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
                          <button disabled title="Generation backend unavailable" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border border-border disabled:opacity-50">
                            <Mail className="w-3 h-3" /> Generation unavailable
                          </button>
                        </td>
                      </tr>
                      {isExpanded && templates.length > 0 && (
                        <tr key={`${key}-detail`} className="bg-muted/20">
                          <td colSpan={5} className="px-6 py-3">
                            <div className="space-y-3">
                              {templates.map((t) => (
                                <div key={t.id} className="p-3 rounded bg-background border border-border space-y-1">
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-medium text-primary">Step {t.step}</span>
                                    <span className="text-sm font-medium text-foreground">{t.subject}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{t.previewText}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-2">{t.bodyText?.slice(0, 200)}...</p>
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
