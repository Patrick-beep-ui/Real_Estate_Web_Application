"use client";

import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import {
  rowToTestimonial,
  type Testimonial,
  type TestimonialRow,
  type TestimonialSection,
  type VideoStory,
  type WrittenStory,
} from "@/types/testimonial";
import TestimonialsSpotlight from "@/components/TestimonialsSpotlight";
import TestimonialsFeatured from "@/components/TestimonialsFeatured";
import TestimonialsEditorial from "@/components/TestimonialsEditorial";

export function TestimonialSectionPreview({
  section,
  rows,
}: {
  section: TestimonialSection;
  rows: TestimonialRow[];
}) {
  const published = rows.filter((r) => r.status === "published");
  const ids = useMemo(() => published.map((r) => r.id), [published]);

  const { data: pointRows = [] } = useQuery({
    queryKey: ["testimonial-points", "section-preview", section, ids.join(",")],
    queryFn: async () => {
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("testimonial_points")
        .select("testimonial_id, point")
        .in("testimonial_id", ids)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
    enabled: ids.length > 0,
  });

  const stories: Testimonial[] = useMemo(() => {
    const pointsByRow = new Map<string, string[]>();
    for (const p of pointRows) {
      const list = pointsByRow.get(p.testimonial_id) ?? [];
      list.push(p.point);
      pointsByRow.set(p.testimonial_id, list);
    }
    return published.map((r) => rowToTestimonial(r, pointsByRow.get(r.id) ?? []));
  }, [published, pointRows]);

  if (stories.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No testimonials assigned — this section currently shows all published
        testimonials on the homepage.
      </div>
    );
  }

  let preview: ReactNode = null;
  if (section === "spotlight") {
    preview = (
      <TestimonialsSpotlight stories={stories} showPendingSlot={false} showTrust={false} />
    );
  } else if (section === "featured") {
    const video = stories.find((s): s is VideoStory => s.kind === "video");
    const written = stories
      .filter((s): s is WrittenStory => s.kind === "written")
      .slice(0, 2);
    preview = <TestimonialsFeatured video={video} written={written} showCta={false} />;
  } else {
    preview = <TestimonialsEditorial stories={stories} ctaLabel="" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-semibold text-foreground">Preview</span>
        <span className="text-xs text-muted-foreground">Live — updates as you edit</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-muted/40">
        {preview}
      </div>
    </div>
  );
}
