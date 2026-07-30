import type { Tables } from "@/lib/supabase/types";

export type TestimonialRow = Tables<"testimonials">;
export type TestimonialPointRow = Tables<"testimonial_points">;

export const TESTIMONIAL_SCENARIOS = [
  "divorce",
  "foreclosure",
  "inherited",
  "relocation",
  "hoarder",
  "fire-damage",
  "probate",
  "downsizing",
] as const;

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
