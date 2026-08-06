"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/shared/use-toast";

export function useTestimonialMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
  };

  async function savePoints(testimonialId: string, points: string[]) {
    const { error: delError } = await supabase
      .from("testimonial_points")
      .delete()
      .eq("testimonial_id", testimonialId);
    if (delError) throw delError;
    if (points.length === 0) return;
    const { error: insError } = await supabase
      .from("testimonial_points")
      .insert(points.map((point, i) => ({ testimonial_id: testimonialId, point, sort_order: i })));
    if (insError) throw insError;
  }

  const createTestimonial = useMutation({
    mutationFn: async (form: Record<string, unknown>) => {
      const points = (form.points as string[]) || [];
      const { data, error } = await supabase
        .from("testimonials")
        .insert({
          kind: form.kind as string,
          name: form.name as string,
          body: form.body as string,
          location: (form.location as string) || null,
          scenario: (form.scenario as string) || null,
          reason: (form.reason as string) || null,
          headline: (form.headline as string) || null,
          pull_quote: (form.pull_quote as string) || null,
          youtube_id: (form.youtube_id as string) || null,
          video_src: (form.video_src as string) || null,
          poster_url: (form.poster_url as string) || null,
          thumbnail_url: (form.thumbnail_url as string) || null,
          rating: (form.rating as number) ?? 5,
          is_featured: (form.is_featured as boolean) ?? false,
          sort_order: (form.sort_order as number) ?? 0,
          status: form.status as string,
          market_slug: (form.market_slug as string) || null,
        })
        .select()
        .single();
      if (error) throw error;
      if (points.length > 0) {
        await savePoints(data.id, points);
      }
    },
    onSuccess: () => { invalidate(); toast({ title: "Testimonial created" }); },
    onError: (err) => { toast({ variant: "destructive", title: "Error", description: (err as Error).message }); },
  });

  const updateTestimonial = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: Record<string, unknown> }) => {
      const points = (form.points as string[]) || [];
      const { error } = await supabase
        .from("testimonials")
        .update({
          kind: form.kind as string,
          name: form.name as string,
          body: form.body as string,
          location: (form.location as string) || null,
          scenario: (form.scenario as string) || null,
          reason: (form.reason as string) || null,
          headline: (form.headline as string) || null,
          pull_quote: (form.pull_quote as string) || null,
          youtube_id: (form.youtube_id as string) || null,
          video_src: (form.video_src as string) || null,
          poster_url: (form.poster_url as string) || null,
          thumbnail_url: (form.thumbnail_url as string) || null,
          rating: (form.rating as number) ?? 5,
          is_featured: (form.is_featured as boolean) ?? false,
          sort_order: (form.sort_order as number) ?? 0,
          status: form.status as string,
          market_slug: (form.market_slug as string) || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      await savePoints(id, points);
    },
    onSuccess: () => { invalidate(); toast({ title: "Testimonial updated" }); },
    onError: (err) => { toast({ variant: "destructive", title: "Error", description: (err as Error).message }); },
  });

  const deleteTestimonial = useMutation({
    mutationFn: async (id: string) => {
      const { data: row, error: fetchError } = await supabase
        .from("testimonials")
        .select("video_src, thumbnail_url")
        .eq("id", id)
        .single();
      if (fetchError) throw fetchError;

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

      const { error } = await supabase
        .from("testimonials")
        .delete()
        .eq("id", id);
      if (error) throw error;

      await Promise.all([cleanupVideo, cleanupThumbnail]);
    },
    onSuccess: () => { invalidate(); toast({ title: "Testimonial deleted" }); },
    onError: (err) => { toast({ variant: "destructive", title: "Error", description: (err as Error).message }); },
  });

  const toggleFeatured = useMutation({
    mutationFn: async (id: string) => {
      const { data: current, error: fetchError } = await supabase
        .from("testimonials")
        .select("is_featured")
        .eq("id", id)
        .single();
      if (fetchError) throw fetchError;
      const { error } = await supabase
        .from("testimonials")
        .update({ is_featured: !current.is_featured, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
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
