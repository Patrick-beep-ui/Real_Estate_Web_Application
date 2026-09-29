import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { SituationConfig } from "@/lib/data/situations";
import type { GeneratedContent } from "@/lib/content/types";
import { scrubCopy } from "@/lib/shared/copy";

const TAG = "[TBH:content]";

/**
 * Fields that belong to the mechanism-first BeforeAfter section.
 * These must NOT be overridden by generated content — the static
 * values are the authoritative source after the Item 1 rewrite.
 */
export const BEFORE_AFTER_FIELDS = [
  "beforeTitle",
  "traditionalPathBody",
  "afterTitle",
  "directPathBody",
  "warningTitle",
  "warningBody",
];

function isClient() {
  return typeof window !== "undefined";
}

/**
 * Strip the 24-hour offer claim from every string the visitor will read — on
 * BOTH the AI and the static side of the merge.
 *
 * The stored row is never mutated. This is the same render-time contract as
 * the phone sanitizer in `phone.ts`, and it is the reason this ships without a
 * data migration: `generated_content` holds hundreds of published rows
 * containing the claim, and rewriting them would mean a partially-updated
 * dataset on any failure. Scrubbing here retires the claim from the live site
 * immediately, and it also hardens the static fallback against a future edit
 * reintroducing the claim in only one of the two layers.
 *
 * Recurses through arrays and plain objects so the `faqs` ({ q, a }) and
 * `noEquity.options` shapes are covered, not just top-level strings.
 */
function cleanCopy<T>(value: T): T {
  if (typeof value === "string") return scrubCopy(value) as T;
  if (Array.isArray(value)) return value.map((item) => cleanCopy(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, cleanCopy(item)])
    ) as T;
  }
  return value;
}

export function useGeneratedContent(marketSlug: string, situationSlug: string) {
  return useQuery({
    enabled: isClient(),
    queryKey: ["generated-content", marketSlug, situationSlug],
    queryFn: async (): Promise<GeneratedContent | null> => {
      console.log(`${TAG} ▶ Fetching content for ${marketSlug}×${situationSlug} (status=published)`);
      const start = performance.now();

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

      const elapsed = (performance.now() - start).toFixed(0);

      if (error) {
        console.error(`${TAG} ✘ DB error after ${elapsed}ms:`, error.message);
        return null;
      }
      if (!data) {
        console.log(`${TAG} ⏭ No published content found for ${marketSlug}×${situationSlug} (${elapsed}ms) — will use static fallback`);
        return null;
      }

      console.log(`${TAG} ✔ Found published content v${data.version} for ${marketSlug}×${situationSlug} (${elapsed}ms)`, {
        version: data.version,
        status: data.status,
        headline_len: data.headline?.length || 0,
        faqs_count: Array.isArray(data.faqs) ? (data.faqs as any[]).length : 0,
        model: data.model_used,
      });

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
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
}

/**
 * Merges AI-generated content over static situation config.
 * AI content wins when available; static is the fallback.
 */
export function mergeContent(
  staticSituation: SituationConfig,
  generated: GeneratedContent | null | undefined,
  skipFields?: string[]
): SituationConfig {
  if (!generated) {
    console.log(`${TAG} mergeContent: no AI content — using 100% static`);
    return cleanCopy(staticSituation);
  }

  const aiFields: string[] = [];
  const staticFields: string[] = [];

  const pick = (field: string, aiVal: string | string[], staticVal: string | string[]): any => {
    if (skipFields?.includes(field)) {
      staticFields.push(field);
      return cleanCopy(staticVal);
    }
    const useAi = Array.isArray(aiVal) ? aiVal.length > 0 : !!aiVal;
    if (useAi) { aiFields.push(field); return cleanCopy(aiVal); }
    staticFields.push(field); return cleanCopy(staticVal);
  };

  const merged = {
    // Spread is cleaned too so non-picked fields (`noEquity.options`,
    // `label`, `storySlug`) cannot carry the claim past `pick`.
    ...cleanCopy(staticSituation),
    headline: pick("headline", generated.headline, staticSituation.headline),
    subheadline: pick("subheadline", generated.subheadline, staticSituation.subheadline),
    bodyParagraphs: pick("bodyParagraphs", generated.body_paragraphs, staticSituation.bodyParagraphs),
    bullets: pick("bullets", generated.bullets, staticSituation.bullets),
    faqs: pick("faqs", generated.faqs as any, staticSituation.faqs as any),
    videoCaptionLines: pick("videoCaptionLines", generated.video_caption_lines, staticSituation.videoCaptionLines),
    beforeTitle: pick("beforeTitle", generated.before_title, staticSituation.beforeTitle),
    traditionalPathBody: pick("traditionalPathBody", generated.before_body, staticSituation.traditionalPathBody),
    afterTitle: pick("afterTitle", generated.after_title, staticSituation.afterTitle),
    directPathBody: pick("directPathBody", generated.after_body, staticSituation.directPathBody),
    warningTitle: pick("warningTitle", generated.warning_title, staticSituation.warningTitle),
    warningBody: pick("warningBody", generated.warning_body, staticSituation.warningBody),
    urgencyLine: pick("urgencyLine", generated.urgency_line, staticSituation.urgencyLine),
    whyTarekBody: pick("whyTarekBody", generated.why_tarek_body, staticSituation.whyTarekBody),
    finalCtaHeadline: pick("finalCtaHeadline", generated.final_cta_headline, staticSituation.finalCtaHeadline),
    finalCtaSubline: pick("finalCtaSubline", generated.final_cta_subline, staticSituation.finalCtaSubline),
    metaTitle: pick("metaTitle", generated.meta_title, staticSituation.metaTitle),
    metaDescription: pick("metaDescription", generated.meta_description, staticSituation.metaDescription),
    smsPrefilledText: pick("smsPrefilledText", generated.sms_prefilled_text, staticSituation.smsPrefilledText),
  };

  console.log(`${TAG} mergeContent: ${aiFields.length} AI fields, ${staticFields.length} static fallbacks`, {
    ai: aiFields,
    static: staticFields,
  });

  return merged;
}
