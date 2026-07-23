"use client";

import { useState } from "react";
import type { Lead, PipelineStage } from "@/lib/leads/types";

export function useKanbanDragDrop(
  filteredLeads: Lead[],
  batchUpdatePipelineStages: {
    mutateAsync: (changes: Record<string, PipelineStage>) => Promise<unknown>;
  }
) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [pendingPipelineChanges, setPendingPipelineChanges] = useState<Record<string, PipelineStage>>({});
  const [saving, setSaving] = useState(false);

  const getLeadsForStage = (stage: PipelineStage) => {
    return filteredLeads.filter((l) => (pendingPipelineChanges[l.id] ?? l.pipeline_stage ?? "new") === stage);
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
      setPendingPipelineChanges({});
    } finally {
      setSaving(false);
    }
  };

  const handleRevertAll = () => {
    setPendingPipelineChanges({});
  };

  const pendingCount = Object.keys(pendingPipelineChanges).length;

  return {
    draggedId,
    pendingPipelineChanges,
    saving,
    pendingCount,
    getLeadsForStage,
    handleDragStart,
    handleDrop,
    handleSaveAll,
    handleRevertAll,
  };
}
