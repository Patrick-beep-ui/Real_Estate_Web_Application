import type { Tables } from "@/lib/supabase/types";

export type BlogPost = Tables<"blog_posts">;

export const CATEGORIES = [
  "seller-guides",
  "market-trends",
  "cash-offers",
  "real-estate-tips",
  "local-insights",
] as const;

export const SCHEMA_TYPES = ["Article", "HowTo", "FAQPage", "BlogPosting"] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  "seller-guides": "Seller Guides",
  "market-trends": "Market Trends",
  "cash-offers": "Cash Offers",
  "real-estate-tips": "Real Estate Tips",
  "local-insights": "Local Insights",
};
