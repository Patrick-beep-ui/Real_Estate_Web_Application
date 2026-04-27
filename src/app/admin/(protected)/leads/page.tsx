"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Search, Phone, Mail, MapPin, MessageCircle, DollarSign, GripVertical, StickyNote, Save, RotateCcw, Loader2, Maximize2 } from "lucide-react";
import { LeadDetailsModal } from "@/components/admin/leads/LeadDetailsModal";

const PIPELINE_STAGES = [
  { key: "new", label: "New", color: "bg-yellow-500/20 border-yellow-500/40 text-yellow-400", status: "new" },
  { key: "contacted", label: "Contacted", color: "bg-blue-500/20 border-blue-500/40 text-blue-400", status: "contacted" },
  { key: "offer_made", label: "Offer Made", color: "bg-purple-500/20 border-purple-500/40 text-purple-400", status: "qualified" },
  { key: "under_contract", label: "Under Contract", color: "bg-cyan-500/20 border-cyan-500/40 text-cyan-400", status: "qualified" },
  { key: "closed", label: "Closed", color: "bg-green-500/20 border-green-500/40 text-green-400", status: "closed" },
  { key: "lost", label: "Lost", color: "bg-red-500/20 border-red-500/40 text-red-400", status: "lost" },
] as const;

type PipelineStage = typeof PIPELINE_STAGES[number]["key"];
type PipelineStageStatus = typeof PIPELINE_STAGES[number]["status"];

const STAGE_TO_STATUS: Record<PipelineStage, PipelineStageStatus> = {
  new: "new",
  contacted: "contacted",
  offer_made: "qualified",
  under_contract: "qualified",
  closed: "closed",
  lost: "lost",
};

type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  property_address: string | null;
  pipeline_stage: string | null;
  status: string | null;
  offer_amount: number | null;
  notes: string | null;
  market_slug: string;
  situation_slug: string;
  created_at: string;
};

const AdminLeads = () => {
  const [search, setSearch] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [pendingPipelineChanges, setPendingPipelineChanges] = useState<Record<string, PipelineStage>>({});
  const [saving, setSaving] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
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
      return data as Array<{
        id: string;
        name: string;
        phone: string;
        email: string | null;
        property_address: string | null;
        pipeline_stage: string | null;
        status: string | null;
        offer_amount: number | null;
        notes: string | null;
        market_slug: string;
        situation_slug: string;
        created_at: string;
      }>;
    },
  });

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

  const filtered = leads?.filter((lead) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return lead.name.toLowerCase().includes(s) || lead.phone.includes(s) || (lead.email?.toLowerCase().includes(s));
  });

  const getLeadsForStage = (stage: PipelineStage) => {
    const baseLeads = filtered?.filter((l) => (pendingPipelineChanges[l.id] ?? l.pipeline_stage ?? "new") === stage) ?? [];
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

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const formatSlug = (slug: string) =>
    slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Revenue stats
  const closedLeads = leads?.filter((l) => (l.pipeline_stage || "new") === "closed") ?? [];
  const totalRevenue = closedLeads.reduce((sum, l) => sum + (Number(l.offer_amount) || 0), 0);
  const totalLeads = leads?.length ?? 0;
  const conversionRate = totalLeads > 0 ? ((closedLeads.length / totalLeads) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Lead Pipeline</h1>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Leads" value={totalLeads.toString()} />
        <StatCard label="Closed Deals" value={closedLeads.length.toString()} />
        <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={<DollarSign className="w-4 h-4 text-green-400" />} />
        <StatCard label="Conversion Rate" value={`${conversionRate}%`} />
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, phone, email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

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

      {/* Kanban Board */}
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
                      formatDate={formatDate}
                      formatSlug={formatSlug}
                      onViewDetails={() => setSelectedLead(lead)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    )}

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
        formatDate={formatDate}
        formatSlug={formatSlug}
      />
    )}
  </div>
);
};

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

function LeadCard({
  lead,
  onDragStart,
  onOfferSave,
  onNotesSave,
  formatDate,
  formatSlug,
  onViewDetails,
}: {
  lead: Lead;
  onDragStart: () => void;
  onOfferSave: (amount: number | null) => void;
  onNotesSave: (notes: string) => void;
  formatDate: (d: string) => string;
  formatSlug: (s: string) => string;
  onViewDetails?: () => void;
}) {
  const [editingOffer, setEditingOffer] = useState(false);
  const [offerVal, setOfferVal] = useState(lead.offer_amount?.toString() || "");
  const [showNotes, setShowNotes] = useState(false);
  const [notesVal, setNotesVal] = useState(lead.notes || "");

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="rounded-lg border border-border bg-background p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors"
    >
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex items-center gap-1">
            <GripVertical className="w-3 h-3 text-muted-foreground/50" />
            <span className="text-sm font-semibold text-foreground truncate max-w-[100px]">{lead.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground">{formatDate(lead.created_at)}</span>
            {onViewDetails && (
              <button
                onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
                className="p-0.5 rounded hover:bg-muted transition-colors"
                title="View full details"
              >
                <Maximize2 className="w-5 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

      <div className="space-y-1 mb-2">
        <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
          <Phone className="w-3 h-3" /> {lead.phone}
        </a>
        {lead.email && (
          <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors truncate">
            <Mail className="w-3 h-3" /> {lead.email}
          </a>
        )}
        {lead.property_address && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{lead.property_address}</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 mb-2">
        <Badge variant="outline" className="text-[10px] border-border text-muted-foreground px-1.5 py-0">
          {formatSlug(lead.market_slug)}
        </Badge>
        <Badge variant="outline" className="text-[10px] border-border text-muted-foreground px-1.5 py-0">
          {formatSlug(lead.situation_slug)}
        </Badge>
      </div>

      {/* Offer amount */}
      {editingOffer ? (
        <div className="flex gap-1">
          <input
            type="number"
            value={offerVal}
            onChange={(e) => setOfferVal(e.target.value)}
            placeholder="Offer $"
            className="flex-1 h-6 text-xs rounded border border-input bg-background px-2 text-foreground"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onOfferSave(offerVal ? Number(offerVal) : null);
                setEditingOffer(false);
              }
              if (e.key === "Escape") setEditingOffer(false);
            }}
          />
        </div>
      ) : (
        <button
          onClick={() => setEditingOffer(true)}
          className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          <DollarSign className="w-3 h-3" />
          {lead.offer_amount ? `$${Number(lead.offer_amount).toLocaleString()}` : "Add offer"}
        </button>
      )}

      {/* Notes */}
      {showNotes ? (
        <div className="mt-2 space-y-1">
          <Textarea
            value={notesVal}
            onChange={(e) => setNotesVal(e.target.value)}
            placeholder="Add notes about this lead…"
            className="text-xs min-h-[60px] resize-none"
            autoFocus
          />
          <div className="flex gap-1">
            <button
              onClick={() => { onNotesSave(notesVal); setShowNotes(false); }}
              className="text-[10px] text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5"
            >
              <Save className="w-3 h-3" /> Save
            </button>
            <button
              onClick={() => setShowNotes(false)}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowNotes(true)}
          className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mt-1"
        >
          <StickyNote className="w-3 h-3" />
          {lead.notes ? lead.notes.substring(0, 30) + (lead.notes.length > 30 ? "…" : "") : "Add notes"}
        </button>
      )}

      {/* Quick actions */}
      <div className="flex gap-1.5 mt-2 pt-2 border-t border-border">
        <a href={`tel:${lead.phone}`} className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5">
          <Phone className="w-3 h-3" /> Call
        </a>
        <a href={`sms:${lead.phone}`} className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5">
          <MessageCircle className="w-3 h-3" /> SMS
        </a>
      </div>
    </div>
  );
}

export default AdminLeads;
