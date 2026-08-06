import type { Tables } from "@/lib/supabase/types";

export type TestimonialRow = Tables<"testimonials">;
export type TestimonialPointRow = Tables<"testimonial_points">;
export type TestimonialSectionAssignmentRow = Tables<"testimonial_section_assignments">;

export const TESTIMONIAL_SECTIONS = ["spotlight", "featured", "editorial"] as const;
export type TestimonialSection = (typeof TESTIMONIAL_SECTIONS)[number];

export type VideoStory = {
  id: string;
  kind: "video";
  name: string;
  initial: string;
  location: string;
  headline: string;
  body: string;
  scenario: string;
  youtubeId?: string;
  src?: string;
  poster?: string;
  thumbnail?: string;
  points: string[];
};

export type WrittenStory = {
  id: string;
  kind: "written";
  name: string;
  initial: string;
  location: string;
  pullQuote: string;
  body: string;
  scenario: string;
  reason: string;
  points: string[];
};

export type Testimonial = VideoStory | WrittenStory;

export const TESTIMONIAL_DISCLAIMER =
  "Every story shared with the seller's written consent. Results vary based on property condition, market factors, and individual circumstances. Not a guarantee of any particular outcome.";

export function rowToTestimonial(
  row: TestimonialRow,
  points: string[] = [],
): Testimonial {
  const initial = row.name.charAt(0).toUpperCase();
  const base = {
    id: row.id,
    name: row.name,
    initial,
    location: row.location ?? "",
    scenario: row.scenario ?? "",
    points,
  };
  if (row.kind === "video") {
    return {
      ...base,
      kind: "video" as const,
      headline: row.headline ?? "",
      body: row.body,
      youtubeId: row.youtube_id ?? undefined,
      src: row.video_src ?? undefined,
      poster: row.poster_url ?? undefined,
      thumbnail: row.thumbnail_url ?? undefined,
    };
  }
  return {
    ...base,
    kind: "written" as const,
    pullQuote: row.pull_quote ?? "",
    body: row.body,
    reason: row.reason ?? "",
  };
}
