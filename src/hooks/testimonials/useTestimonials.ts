import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import {
  type TestimonialRow,
  type Testimonial,
  type TestimonialSection,
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

async function fetchPublishedRows(): Promise<TestimonialRow[]> {
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("status", "published")
    .order("sort_order");
  if (error) throw error;
  if (data && data.length === 0) {
    console.warn("No published testimonials in the DB — showing static data");
  }
  return (data ?? []) as TestimonialRow[];
}

export function useTestimonials() {
  return useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      try {
        const rows = await fetchPublishedRows();
        return Promise.all(rows.map(enrichTestimonial));
      } catch (err) {
        console.warn("Testimonials fetch failed — showing static data", err);
        throw err;
      }
    },
  });
}

export function useTestimonialSection(section: TestimonialSection) {
  return useQuery({
    queryKey: ["testimonials", "section", section],
    queryFn: async () => {
      try {
        const { data: assignments, error } = await supabase
          .from("testimonial_section_assignments")
          .select("testimonial_id")
          .eq("section", section)
          .order("sort_order");
        if (error) throw error;
        if (!assignments || assignments.length === 0) {
          const rows = await fetchPublishedRows();
          return Promise.all(rows.map(enrichTestimonial));
        }
        const ids = assignments.map((a) => a.testimonial_id);
        const { data: rows, error: rowsError } = await supabase
          .from("testimonials")
          .select("*")
          .in("id", ids)
          .eq("status", "published");
        if (rowsError) throw rowsError;
        const byId = new Map<string, TestimonialRow>(
          (rows ?? []).map((r) => [r.id, r]),
        );
        const ordered = ids
          .map((id) => byId.get(id))
          .filter((r): r is TestimonialRow => !!r);
        return Promise.all(ordered.map(enrichTestimonial));
      } catch (err) {
        console.warn(
          `Testimonials fetch failed for section "${section}" — showing fallback content`,
          err,
        );
        throw err;
      }
    },
  });
}

export function useTestimonialsByScenario(scenario: string) {
  return useQuery({
    queryKey: ["testimonials", "scenario", scenario],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("testimonials")
          .select("*")
          .eq("status", "published")
          .eq("scenario", scenario)
          .order("sort_order");
        if (error) throw error;
        if (data && data.length === 0) {
          console.warn(
            `No published testimonials for scenario "${scenario}" — showing static data`,
          );
        }
        return Promise.all((data ?? []).map(enrichTestimonial));
      } catch (err) {
        console.warn(
          `Testimonials fetch failed for scenario "${scenario}" — showing static data`,
          err,
        );
        throw err;
      }
    },
    enabled: !!scenario,
  });
}

export function useTestimonialsByMarket(marketSlug: string) {
  return useQuery({
    queryKey: ["testimonials", "market", marketSlug],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("testimonials")
          .select("*")
          .eq("status", "published")
          .eq("market_slug", marketSlug)
          .order("sort_order");
        if (error) throw error;
        if (data && data.length === 0) {
          console.warn(
            `No published testimonials for market "${marketSlug}" — showing static data`,
          );
        }
        return Promise.all((data ?? []).map(enrichTestimonial));
      } catch (err) {
        console.warn(
          `Testimonials fetch failed for market "${marketSlug}" — showing static data`,
          err,
        );
        throw err;
      }
    },
    enabled: !!marketSlug,
  });
}

export function useFeaturedTestimonial() {
  return useQuery({
    queryKey: ["testimonials", "featured"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("testimonials")
          .select("*")
          .eq("status", "published")
          .eq("is_featured", true)
          .maybeSingle();
        if (error) throw error;
        if (!data) return null;
        return enrichTestimonial(data);
      } catch (err) {
        console.warn("Featured testimonial fetch failed — falling back to defaults", err);
        throw err;
      }
    },
  });
}

export function useAdminTestimonials() {
  return useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("testimonials")
          .select("*")
          .order("sort_order");
        if (error) throw error;
        return (data ?? []) as TestimonialRow[];
      } catch (err) {
        console.error("Failed to load testimonials (admin) — check Supabase access", err);
        throw err;
      }
    },
  });
}

export function useTestimonialPoints(testimonialId: string | null) {
  return useQuery({
    queryKey: ["testimonial-points", testimonialId],
    queryFn: async () => {
      try {
        if (!testimonialId) return [];
        return fetchPoints(testimonialId);
      } catch (err) {
        console.error(
          `Failed to fetch points for testimonial "${testimonialId}"`,
          err,
        );
        throw err;
      }
    },
    enabled: !!testimonialId,
  });
}
