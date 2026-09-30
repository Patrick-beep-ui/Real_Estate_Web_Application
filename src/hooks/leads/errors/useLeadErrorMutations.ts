"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/api";
import { useToast } from "@/hooks/shared/use-toast";
import type { LeadError } from "./useLeadErrors";
import type { RetryResult } from "@/components/admin/lead-errors/RetryProgressModal";

export type RetryParams = {
  errorRecord: LeadError;
  modifiedPayload?: Record<string, unknown>;
};

type RetryResponse = RetryResult & { errorId: string; name?: string; phone?: string };

export function useLeadErrorMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-lead-errors"] });
    queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
    queryClient.invalidateQueries({ queryKey: ["admin-analytics-stats"] });
    queryClient.invalidateQueries({ queryKey: ["admin-overview-stats"] });
  };

  const retryMutation = useMutation({
    mutationFn: async ({ errorRecord, modifiedPayload }: RetryParams): Promise<RetryResponse> => {
      const data = await adminApi.post<RetryResult>(
        `/api/admin/lead-errors/${errorRecord.id}/retry`,
        { modifiedPayload },
      );
      return {
        ...data,
        errorId: errorRecord.id,
        name: errorRecord.name ?? undefined,
        phone: errorRecord.phone ?? undefined,
      };
    },
    onSuccess: () => {
      invalidate();
    },
    onError: () => {
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/api/admin/lead-errors/${id}`),
    onSuccess: () => {
      invalidate();
      toast({ title: "Error record deleted" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Delete failed", description: (error as Error).message });
    },
  });

  const clearResolvedMutation = useMutation({
    mutationFn: () => adminApi.delete("/api/admin/lead-errors/resolved"),
    onSuccess: () => {
      invalidate();
      toast({ title: "Resolved errors cleared" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Clear failed", description: (error as Error).message });
    },
  });

  return { retryMutation, deleteMutation, clearResolvedMutation };
}
