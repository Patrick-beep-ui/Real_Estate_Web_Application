"use client";

import { useMemo, type ReactNode } from "react";
import {
  rowToTestimonial,
  type Testimonial,
  type TestimonialRow,
  type TestimonialSection,
  type VideoStory,
  type WrittenStory,
} from "@/types/testimonial";
import TestimonialsSpotlight from "@/components/testimonials/TestimonialsSpotlight";
import TestimonialsFeatured from "@/components/testimonials/TestimonialsFeatured";
import TestimonialsEditorial from "@/components/testimonials/TestimonialsEditorial";

export function TestimonialSectionPreview({
  section,
  rows,
}: {
  section: TestimonialSection;
  rows: Array<TestimonialRow & { points: string[] }>;
}) {
  const published = rows.filter((r) => r.status === "published");

  const stories: Testimonial[] = useMemo(() => {
    return published.map((row) => rowToTestimonial(row, row.points));
  }, [published]);

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
