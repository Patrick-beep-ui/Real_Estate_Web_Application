"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/api";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/shared/use-toast";
import type { TestimonialRow } from "@/types/testimonial";

export function useTestimonialMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
    queryClient.invalidateQueries({ queryKey: ["testimonials"] });
  };

  const createTestimonial = useMutation({
    mutationFn: (form: Record<string, unknown>) => adminApi.post("/api/admin/testimonials", form),
    onSuccess: () => { invalidate(); toast({ title: "Testimonial created" }); },
    onError: (err) => { toast({ variant: "destructive", title: "Error", description: (err as Error).message }); },
  });

  const updateTestimonial = useMutation({
    mutationFn: ({ id, form }: { id: string; form: Record<string, unknown> }) =>
      adminApi.patch(`/api/admin/testimonials/${id}`, form),
    onSuccess: () => { invalidate(); toast({ title: "Testimonial updated" }); },
    onError: (err) => { toast({ variant: "destructive", title: "Error", description: (err as Error).message }); },
  });

  const deleteTestimonial = useMutation({
    mutationFn: async (row: TestimonialRow) => {

      const cleanupVideo = (async () => {
        if (!row?.video_src) return;
        try {
          const match = row.video_src.match(/\/testimonial-videos\/(.+)$/);
          if (match) {
            await supabase.storage.from("testimonial-videos").remove([match[1]]);
          }
        } catch {}
      })();

      const cleanupThumbnail = (async () => {
        if (!row?.thumbnail_url) return;
        try {
          const match = row.thumbnail_url.match(/\/testimonial-thumbnails\/(.+)$/);
          if (match) {
            await supabase.storage.from("testimonial-thumbnails").remove([match[1]]);
          }
        } catch {}
      })();

      await adminApi.delete(`/api/admin/testimonials/${row.id}`);

      await Promise.all([cleanupVideo, cleanupThumbnail]);
    },
    onSuccess: () => { invalidate(); toast({ title: "Testimonial deleted" }); },
    onError: (err) => { toast({ variant: "destructive", title: "Error", description: (err as Error).message }); },
  });

  const toggleFeatured = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      adminApi.patch(`/api/admin/testimonials/${id}/featured`, { isFeatured }),
    onSuccess: () => { invalidate(); toast({ title: "Featured status toggled" }); },
    onError: (err) => { toast({ variant: "destructive", title: "Error", description: (err as Error).message }); },
  });

  return {
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    toggleFeatured,
  };
}
