"use client";

import { Loader2, RotateCcw, Save } from "lucide-react";
import { useLeadMutations } from "@/hooks/useLeadMutations";
import { useKanbanDragDrop } from "@/hooks/useKanbanDragDrop";
import { LeadCard } from "@/components/admin/leads/LeadCard";
import { PIPELINE_STAGES } from "@/lib/leads/types";
import type { Lead } from "@/lib/leads/types";

export function LeadKanbanBoard({
  sortedLeads,
  setSelectedLead,
  isLoading,
}: {
  sortedLeads: Lead[];
  setSelectedLead: (lead: Lead | null) => void;
  isLoading: boolean;
}) {
  const { updateOfferAmount, updateNotes, batchUpdatePipelineStages } = useLeadMutations();
  const {
    pendingPipelineChanges, saving, pendingCount,
    getLeadsForStage, handleDragStart, handleDrop,
    handleSaveAll, handleRevertAll,
  } = useKanbanDragDrop(sortedLeads, batchUpdatePipelineStages);

  return (
    <>
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">
            {pendingCount} pending change{pendingCount !== 1 ? "s" : ""}
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
    </>
  );
}
