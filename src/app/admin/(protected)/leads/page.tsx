"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Phone, Mail, MessageCircle, RotateCcw, Loader2, Maximize2, ArrowUp, ArrowDown, Save } from "lucide-react";
import { LeadDetailsModal } from "@/components/admin/leads/LeadDetailsModal";
import { LeadStatsCards } from "@/components/admin/leads/LeadStatsCards";
import { LeadCard } from "@/components/admin/leads/LeadCard";
import { useLeadFilters, getAdPlatform } from "./useLeadFilters";
import { formatDate, formatSlug } from "@/lib/leads/utils";
import { PIPELINE_STAGES, STAGE_TO_STATUS } from "@/lib/leads/types";
import type { Lead, PipelineStage } from "@/lib/leads/types";
import { AdPlatformFilter } from "./AdPlatformFilter";
import { QualificationFilters } from "./QualificationFilters";
import { DateRangeFilter } from "./DateRangeFilter";
import { ExportButton } from "./ExportButton";

const AdminLeads = () => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [pendingPipelineChanges, setPendingPipelineChanges] = useState<Record<string, PipelineStage>>({});
  const [saving, setSaving] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [tableEditingOffer, setTableEditingOffer] = useState<{ id: string; value: string } | null>(null);
  const [tableEditingNotes, setTableEditingNotes] = useState<{ id: string; value: string } | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: leads, isLoading } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Array<Lead>;
    },
  });

  const { filteredLeads, search, setSearch, filterAdPlatform, setFilterAdPlatform, dateRange, setDateRange, qualificationFilters, addQualificationFilter, updateQualificationFilter, removeQualificationFilter } = useLeadFilters(leads);

  const updateOfferAmount = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number | null }) => {
      const { error } = await supabase
        .from("leads")
        .update({ offer_amount: amount })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics-leads"] });
      toast({ title: "Offer amount saved" });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const batchUpdatePipelineStages = useMutation({
    mutationFn: async (changes: Record<string, PipelineStage>) => {
      const promises = Object.entries(changes).map(([id, stage]) =>
        supabase.from("leads").update({ 
          pipeline_stage: stage,
          status: STAGE_TO_STATUS[stage]
        }).eq("id", id)
      );
      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw new Error(`Failed to update ${errors.length} lead(s)`);
    },
    onSuccess: () => {
      setPendingPipelineChanges({});
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics-leads"] });
      toast({ title: "Pipeline stages updated" });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const updateNotes = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({ notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics-leads"] });
      toast({ title: "Notes saved" });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics-leads"] });
      setSelectedLead(null);
      toast({ title: "Lead deleted successfully" });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Error deleting lead", description: err.message });
    },
  });

  const sortedLeads = useMemo(() => {
    const sorted = [...filteredLeads];
    if (sortConfig) {
      sorted.sort((a, b) => {
        let aVal: any;
        let bVal: any;
        switch (sortConfig.key) {
          case "name":
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
            break;
          case "created_at":
            aVal = new Date(a.created_at).getTime();
            bVal = new Date(b.created_at).getTime();
            break;
          case "pipeline_stage":
            aVal = a.pipeline_stage ?? "new";
            bVal = b.pipeline_stage ?? "new";
            break;
          case "offer_amount":
            aVal = a.offer_amount ?? 0;
            bVal = b.offer_amount ?? 0;
            break;
          case "market_slug":
            aVal = a.market_slug.toLowerCase();
            bVal = b.market_slug.toLowerCase();
            break;
          case "situation_slug":
            aVal = a.situation_slug.toLowerCase();
            bVal = b.situation_slug.toLowerCase();
            break;
          case "source":
            aVal = getAdPlatform(a)?.label ?? "";
            bVal = getAdPlatform(b)?.label ?? "";
            break;
          default:
            return 0;
        }
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [filteredLeads, sortConfig]);

  const requestSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc" ? { key, direction: "desc" } : null;
      }
      return { key, direction: "asc" };
    });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === "asc"
      ? <ArrowUp className="inline w-3 h-3 ml-1" />
      : <ArrowDown className="inline w-3 h-3 ml-1" />;
  };

  const getLeadsForStage = (stage: PipelineStage) => {
    const baseLeads = filteredLeads.filter((l) => (pendingPipelineChanges[l.id] ?? l.pipeline_stage ?? "new") === stage);
    return baseLeads;
  };

  const handleDragStart = (id: string) => setDraggedId(id);

  const handleDrop = (stage: PipelineStage) => {
    if (draggedId) {
      setPendingPipelineChanges((prev) => ({ ...prev, [draggedId]: stage }));
      setDraggedId(null);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await batchUpdatePipelineStages.mutateAsync(pendingPipelineChanges);
    } finally {
      setSaving(false);
    }
  };

  const handleRevertAll = () => {
    setPendingPipelineChanges({});
  };

  // Revenue stats
  const closedLeads = filteredLeads?.filter((l) => (l.pipeline_stage || "new") === "closed") ?? [];
  const totalRevenue = closedLeads.reduce((sum, l) => sum + (Number(l.offer_amount) || 0), 0);
  const totalLeads = filteredLeads?.length ?? 0;
  const conversionRate = totalLeads > 0 ? ((closedLeads.length / totalLeads) * 100).toFixed(1) : "0";
  const googleAdsLeads = leads?.filter((l) => l.gclid || l.utm_source === "adwords").length ?? 0;
  const metaAdsLeads = leads?.filter((l) => l.fbclid || l.utm_source === "facebook" || l.utm_source === "meta").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Lead Pipeline</h1>
      </div>

      <LeadStatsCards stats={{ totalLeads, closedLeads, totalRevenue, conversionRate, googleAdsLeads, metaAdsLeads }} />

      {/* Search & Actions & View Toggle */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, phone, email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "kanban" | "table")}>
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
          </TabsList>
        </Tabs>
        

        {Object.keys(pendingPipelineChanges).length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {Object.keys(pendingPipelineChanges).length} pending change{Object.keys(pendingPipelineChanges).length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={handleRevertAll}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Revert
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <AdPlatformFilter value={filterAdPlatform} onChange={setFilterAdPlatform} />
        <QualificationFilters
          filters={qualificationFilters}
          onAdd={addQualificationFilter}
          onUpdate={updateQualificationFilter}
          onRemove={removeQualificationFilter}
        />
        <DateRangeFilter value={dateRange} onChange={(range) => setDateRange(range ?? {})} />
        <div className="ml-auto">
          <ExportButton leads={filteredLeads} />
        </div>
      </div>

      {/* Kanban Board */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "kanban" | "table")}>
        <TabsContent value="kanban">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {PIPELINE_STAGES.map((s) => (
                <div key={s.key} className="rounded-xl border border-border bg-card p-4 min-h-[300px]">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded mb-4" />
                  <div className="space-y-3">
                    {[1, 2].map((i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {PIPELINE_STAGES.map((stage) => {
                const stageLeads = getLeadsForStage(stage.key);
                return (
                  <div
                    key={stage.key}
                    className="rounded-xl border border-border bg-card/50 min-h-[300px] flex flex-col"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(stage.key)}
                  >
                    <div className="p-3 border-b border-border flex items-center justify-between">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full border ${stage.color}`}>
                        {stage.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{stageLeads.length}</span>
                    </div>
                    <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[60vh]">
                      {stageLeads.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          onDragStart={() => handleDragStart(lead.id)}
                          onOfferSave={(amount) => updateOfferAmount.mutate({ id: lead.id, amount })}
                          onNotesSave={(notes) => updateNotes.mutate({ id: lead.id, notes })}
                          onViewDetails={() => setSelectedLead(lead)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Table View */}
        <TabsContent value="table">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer select-none" onClick={() => requestSort("name")}>
                      Name{getSortIcon("name")}
                    </TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => requestSort("pipeline_stage")}>
                      Stage{getSortIcon("pipeline_stage")}
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => requestSort("market_slug")}>
                      Market{getSortIcon("market_slug")}
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => requestSort("situation_slug")}>
                      Situation{getSortIcon("situation_slug")}
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => requestSort("source")}>Source{getSortIcon("source")}</TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => requestSort("offer_amount")}>
                      Offer{getSortIcon("offer_amount")}
                    </TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => requestSort("created_at")}>
                      Date{getSortIcon("created_at")}
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(sortedLeads || []).map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="text-left hover:text-primary transition-colors"
                        >
                          {lead.name}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                            <Phone className="w-3 h-3" /> {lead.phone}
                          </a>
                          {lead.email && (
                            <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                              <Mail className="w-3 h-3" /> {lead.email}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {lead.property_address ? (
                          <span className="text-xs text-muted-foreground truncate block">{lead.property_address}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${PIPELINE_STAGES.find(s => s.key === (lead.pipeline_stage || "new"))?.color || ""}`}>
                          {lead.pipeline_stage || "new"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                          {formatSlug(lead.market_slug)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                          {formatSlug(lead.situation_slug)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const ad = getAdPlatform(lead);
                          return ad ? (
                            <Badge variant="outline" className={`text-xs ${ad.color}`}>
                              {ad.label}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">—</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {tableEditingOffer?.id === lead.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={tableEditingOffer.value}
                              onChange={(e) => setTableEditingOffer({ id: lead.id, value: e.target.value })}
                              className="w-24 h-7 text-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  updateOfferAmount.mutate({ id: lead.id, amount: tableEditingOffer.value ? Number(tableEditingOffer.value) : null });
                                  setTableEditingOffer(null);
                                }
                                if (e.key === "Escape") setTableEditingOffer(null);
                              }}
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => setTableEditingOffer({ id: lead.id, value: lead.offer_amount?.toString() || "" })}
                            className="text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            {lead.offer_amount ? `$${Number(lead.offer_amount).toLocaleString()}` : "—"}
                          </button>
                        )}
                      </TableCell>
                      <TableCell>
                        {tableEditingNotes?.id === lead.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={tableEditingNotes.value}
                              onChange={(e) => setTableEditingNotes({ id: lead.id, value: e.target.value })}
                              className="w-32 h-7 text-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  updateNotes.mutate({ id: lead.id, notes: tableEditingNotes.value });
                                  setTableEditingNotes(null);
                                }
                                if (e.key === "Escape") setTableEditingNotes(null);
                              }}
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => setTableEditingNotes({ id: lead.id, value: lead.notes || "" })}
                            className="text-xs text-muted-foreground hover:text-primary transition-colors max-w-[150px] truncate block"
                            title={lead.notes || ""}
                          >
                            {lead.notes ? lead.notes.substring(0, 30) + (lead.notes.length > 30 ? "…" : "") : "—"}
                          </button>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{formatDate(lead.created_at)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <a href={`tel:${lead.phone}`} title="Call">
                            <Phone className="w-4 h-4 text-muted-foreground hover:text-primary" />
                          </a>
                          <a href={`sms:${lead.phone}`} title="SMS">
                            <MessageCircle className="w-4 h-4 text-muted-foreground hover:text-primary" />
                          </a>
                          <button onClick={() => setSelectedLead(lead)} title="View Details">
                            <Maximize2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          open={!!selectedLead}
          onOpenChange={(open) => !open && setSelectedLead(null)}
          onOfferSave={(amount) => {
            updateOfferAmount.mutate({ id: selectedLead.id, amount });
          }}
          onNotesSave={(notes) => {
            updateNotes.mutate({ id: selectedLead.id, notes });
          }}
          onDelete={() => {
            deleteLead.mutate(selectedLead.id);
          }}
          formatDate={formatDate}
          formatSlug={formatSlug}
        />
      )}
    </div>
  );
};

export default AdminLeads;
