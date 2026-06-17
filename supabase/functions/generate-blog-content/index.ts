import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { blogContentModule } from "../ai/index.ts";
import { MARKET_LOCATIONS } from "../ai/data/blog-topics.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildMarketLinks(): string {
  const shuffled = [...MARKET_LOCATIONS].sort(() => Math.random() - 0.5).slice(0, 5);
  return shuffled
    .map((loc) => `- [Sell your house fast in ${loc.city}](/locations/${loc.slug})`)
    .join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, category, marketLinks }: {
      title: string;
      category?: string;
      marketLinks?: string;
    } = await req.json();

    if (!title) {
      return new Response(JSON.stringify({ error: "title is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cat = category || "seller-guides";
    const links = marketLinks || buildMarketLinks();

    console.log(`Generating blog post: "${title}" [${cat}]`);

    const post = await blogContentModule.generateBlogPost(title, cat, links);
    if (!post) throw new Error("Blog post generation failed");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const { data, error } = await supabase.from("blog_posts").insert({
      title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      meta_description: post.meta_description,
      seo_title: post.seo_title,
      category: cat,
      status: "draft",
      published_at: new Date().toISOString(),
    }).select().single();

    if (error) throw error;

    console.log(`Blog post created: ${post.slug}`);

    return new Response(JSON.stringify({ success: true, post: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-blog-content error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
