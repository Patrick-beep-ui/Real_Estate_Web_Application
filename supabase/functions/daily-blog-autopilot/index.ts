import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { blogContentModule, blogImageModule } from "../ai/index.ts";
import { selectTodaysTopic } from "../ai/helpers/topic-selector.ts";
import { MARKET_LOCATIONS } from "../ai/data/blog-topics.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildMarketLinks(): string {
  const shuffled = [...MARKET_LOCATIONS].sort(() => Math.random() - 0.5).slice(0, 5);
  return shuffled
    .map((loc) => `- [Sell your house fast in ${loc.city}](/markets/${loc.slug})`)
    .join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    let topic = await selectTodaysTopic(supabase);

    if (!topic) {
      console.log("No predefined topics left, generating dynamic topic");
      topic = await blogContentModule.generateDynamicTopic();
    }

    console.log(`Selected topic: "${topic.title}" [${topic.category}]`);

    const links = buildMarketLinks();
    const post = await blogContentModule.generateBlogPost(topic.title, topic.category, links);
    if (!post) throw new Error("Blog post generation failed");

    // Normalize any /locations/ links Gemini may have generated beyond the seed links
    const normalizedContent = post.content.replace(/\/locations\//g, "/markets/");

    const { error: upsertError } = await supabase.from("blog_posts").upsert({
      title: topic.title,
      slug: post.slug,
      content: normalizedContent,
      excerpt: post.excerpt,
      meta_description: post.meta_description,
      seo_title: post.seo_title,
      category: topic.category,
      status: "published",
      published_at: new Date().toISOString(),
    }, { onConflict: "slug" });

    if (upsertError) throw upsertError;

    console.log(`Blog post created: ${post.slug}`);

    const images = await blogImageModule.generateBlogImages(
      supabase, post.slug, topic.title, post.content, 3
    );

    if (images.length > 0) {
      const updated = blogImageModule.insertImagesIntoContent(post.content, images);

      const payload: Record<string, string> = { content: updated };
      payload.featured_image_url = images[0].url;
      payload.og_image_url = images[0].url;

      await supabase.from("blog_posts").update(payload).eq("slug", post.slug);
      console.log(`Blog updated with ${images.length} images`);
    }

    return new Response(JSON.stringify({
      success: true,
      title: topic.title,
      slug: post.slug,
      images: images.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("daily-blog-autopilot error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
