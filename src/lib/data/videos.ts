export const VIDEOS: Record<string, string> = {
  foreclosure: "f1aI7mUqwyk",
  divorce: "Gj0TV2sMyVQ",
  inherited: "d_7jSzd2Y5Y",
  "behind-on-payments" : "u2YvvdUC0Q4"
};

export type VideoSlug = "foreclosure" | "divorce" | "inherited" | "behind-on-payments";
export const VIDEOS_CDN: Record<VideoSlug, string> = {
  foreclosure: "foreclosure.mp4",
  divorce: "divorce.mp4",
  inherited: "inherited.mp4",
  "behind-on-payments": "behind-on-payments.mp4",
} as const;