"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/shared/use-toast";
import { STAGE_TO_STATUS } from "@/lib/leads/types";
import type { PipelineStage } from "@/lib/leads/types";

export function useLeadMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
    queryClient.invalidateQueries({ queryKey: ["admin-analytics-leads"] });
  };

  const updateOfferAmount = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number | null }) => {
      const { error } = await supabase
        .from("leads")
        .update({ offer_amount: amount })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
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
      invalidate();
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
      invalidate();
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
      invalidate();
      toast({ title: "Lead deleted successfully" });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Error deleting lead", description: err.message });
    },
  });

  return { updateOfferAmount, batchUpdatePipelineStages, updateNotes, deleteLead };
}
