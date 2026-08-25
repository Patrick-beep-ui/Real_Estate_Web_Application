import "server-only";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/shared/env";
import type { Database } from "@/lib/supabase/types";
import type { GeneratedContent } from "@/lib/content/types";

export const fetchGeneratedContent = cache(
  async (
    marketSlug: string,
    situationSlug: string
  ): Promise<GeneratedContent | null> => {
    try {
      const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
      });
      const { data, error } = await supabase
        .from("generated_content")
        .select("*")
        .eq("market_slug", marketSlug)
        .eq("situation_slug", situationSlug)
        .eq("content_type", "full_page")
        .eq("status", "published")
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[content:server] DB error:", error.message);
        return null;
      }
      if (!data) return null;

      return {
        headline: data.headline || "",
        subheadline: data.subheadline || "",
        body_paragraphs: (data.body_paragraphs as string[]) || [],
        bullets: (data.bullets as string[]) || [],
        faqs: (data.faqs as { q: string; a: string }[]) || [],
        before_title: data.before_title || "",
        before_body: data.before_body || "",
        after_title: data.after_title || "",
        after_body: data.after_body || "",
        warning_title: data.warning_title || "",
        warning_body: data.warning_body || "",
        urgency_line: data.urgency_line || "",
        final_cta_headline: data.final_cta_headline || "",
        final_cta_subline: data.final_cta_subline || "",
        meta_title: data.meta_title || "",
        meta_description: data.meta_description || "",
        why_tarek_body: (data.why_tarek_body as string[]) || [],
        video_caption_lines: (data.video_caption_lines as string[]) || [],
        sms_prefilled_text: data.sms_prefilled_text || "",
      };
    } catch (err) {
      console.error("[content:server] Unexpected error:", err);
      return null;
    }
  }
);
