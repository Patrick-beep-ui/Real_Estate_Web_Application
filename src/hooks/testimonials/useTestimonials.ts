import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import {
  type TestimonialRow,
  type Testimonial,
  rowToTestimonial,
} from "@/types/testimonial";

async function fetchPoints(testimonialId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("testimonial_points")
    .select("point")
    .eq("testimonial_id", testimonialId)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((r) => r.point);
}

async function enrichTestimonial(row: TestimonialRow): Promise<Testimonial> {
  const points =
    row.kind === "video" || row.kind === "written"
      ? await fetchPoints(row.id)
      : [];
  return rowToTestimonial(row, points);
}

export function useTestimonials() {
  return useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("status", "published")
        .order("sort_order");
      if (error) throw error;
      return Promise.all((data ?? []).map(enrichTestimonial));
    },
  });
}

export function useTestimonialsByScenario(scenario: string) {
  return useQuery({
    queryKey: ["testimonials", "scenario", scenario],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("status", "published")
        .eq("scenario", scenario)
        .order("sort_order");
      if (error) throw error;
      return Promise.all((data ?? []).map(enrichTestimonial));
    },
    enabled: !!scenario,
  });
}

export function useTestimonialsByMarket(marketSlug: string) {
  return useQuery({
    queryKey: ["testimonials", "market", marketSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("status", "published")
        .eq("market_slug", marketSlug)
        .order("sort_order");
      if (error) throw error;
      return Promise.all((data ?? []).map(enrichTestimonial));
    },
    enabled: !!marketSlug,
  });
}

export function useFeaturedTestimonial() {
  return useQuery({
    queryKey: ["testimonials", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("status", "published")
        .eq("is_featured", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return enrichTestimonial(data);
    },
  });
}

export function useAdminTestimonials() {
  return useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as TestimonialRow[];
    },
  });
}

export function useTestimonialPoints(testimonialId: string | null) {
  return useQuery({
    queryKey: ["testimonial-points", testimonialId],
    queryFn: async () => {
      if (!testimonialId) return [];
      return fetchPoints(testimonialId);
    },
    enabled: !!testimonialId,
  });
}
