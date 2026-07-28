"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
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
    queryClient.invalidateQueries({ queryKey: ["admin-analytics-leads"] });
    queryClient.invalidateQueries({ queryKey: ["admin-overview-stats"] });
  };

  const retryMutation = useMutation({
    mutationFn: async ({ errorRecord, modifiedPayload }: RetryParams): Promise<RetryResponse> => {
      const res = await fetch("/api/leads/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ errorRecord, modifiedPayload }),
      });
      const data = await res.json();
      if (!res.ok && !data.dbSuccess && !data.ghlSuccess) {
        throw new Error(data.error || "Retry failed");
      }
      return { ...data, errorId: errorRecord.id, name: errorRecord.name, phone: errorRecord.phone };
    },
    onSuccess: async (result) => {
      const now = new Date().toISOString();
      const updateFields: Record<string, unknown> = {
        retry_count: result.retryCount,
        last_retry_at: now,
      };

      if (result.success) {
        updateFields.resolved = true;
        updateFields.resolved_at = now;
      }

      if (result.error) {
        updateFields.error_code = result.error.code || "RETRY_DB_ERROR";
        updateFields.error_message = result.error.message || "DB insert failed on retry";
        updateFields.error_details = "details" in result.error ? (result.error as { details?: string }).details || null : null;
      }

      if (result.ghlError) {
        updateFields.error_code = "GHL_RETRY_ERROR";
        updateFields.error_message = result.ghlError.message || "GHL sync failed on retry";
      }

      if (result.retry_batch_id) {
        updateFields.retry_batch_id = result.retry_batch_id;
      }

      const { error: updateError } = await supabase
        .from("lead_errors")
        .update(updateFields as never)
        .eq("id", result.errorId);

      if (updateError) {
        console.error("Failed to update error record after retry:", updateError);
      }

      if (result.retry_batch_id && result.name && result.phone && result.beforeGhlSync) {
        const { data: children } = await supabase
          .from("lead_errors")
          .select("id")
          .eq("name", result.name)
          .eq("phone", result.phone)
          .neq("id", result.errorId)
          .gte("created_at", result.beforeGhlSync);

        if (children?.length) {
          const { error: stampError } = await supabase
            .from("lead_errors")
            .update({ retry_batch_id: result.retry_batch_id } as never)
            .in("id", children.map((c) => c.id));

          if (stampError) {
            console.error("Failed to stamp children with batch_id:", stampError);
          }

          if (result.success) {
            await supabase
              .from("lead_errors")
              .update({ resolved: true, resolved_at: now } as never)
              .in("id", children.map((c) => c.id));
          }
        }
      }

      if (result.success && result.retry_batch_id) {
        const { error: batchError } = await supabase
          .from("lead_errors")
          .update({ resolved: true, resolved_at: now } as never)
          .eq("retry_batch_id", result.retry_batch_id);

        if (batchError) {
          console.error("Failed to resolve batch errors:", batchError);
        }
      }

      invalidate();
    },
    onError: () => {
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lead_errors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Error record deleted" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Delete failed", description: (error as Error).message });
    },
  });

  const clearResolvedMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("lead_errors").delete().eq("resolved", true);
      if (error) throw error;
    },
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
