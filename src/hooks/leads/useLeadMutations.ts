"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/api";
import { useToast } from "@/hooks/shared/use-toast";
import type { PipelineStage } from "@/lib/leads/types";

export function useLeadMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
    queryClient.invalidateQueries({ queryKey: ["admin-analytics-stats"] });
  };

  const updateOfferAmount = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number | null }) => {
      await adminApi.patch(`/api/admin/leads/${id}`, { offer_amount: amount });
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
      await adminApi.post("/api/admin/leads/batch", { changes });
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
      await adminApi.patch(`/api/admin/leads/${id}`, { notes });
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
      await adminApi.delete(`/api/admin/leads/${id}`);
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