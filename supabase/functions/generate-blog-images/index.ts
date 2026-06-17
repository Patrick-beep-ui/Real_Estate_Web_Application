import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { blogImageModule } from "../ai/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { blogSlug, blogTitle, blogContent, imageCount, mode }: {
      blogSlug: string;
      blogTitle?: string;
      blogContent?: string;
      imageCount?: number;
      mode?: "auto" | "manual";
    } = await req.json();

    if (!blogSlug) {
      return new Response(JSON.stringify({ error: "blogSlug is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    let title = blogTitle;
    let content = blogContent;

    if (!title || !content) {
      const { data: post, error: fetchError } = await supabase
        .from("blog_posts")
        .select("title, content")
        .eq("slug", blogSlug)
        .single();

      if (fetchError || !post) throw new Error(`Blog post not found: ${blogSlug}`);
      if (!title) title = post.title;
      if (!content) content = post.content || "";
    }

    if (!title || !content) throw new Error("Could not resolve blog title or content");

    const count = imageCount || 3;
    const m = mode || "manual";

    console.log(`Generating ${count} images for: ${blogSlug} [mode=${m}]`);

    const images = await blogImageModule.generateBlogImages(
      supabase, blogSlug, title, content, count
    );

    if (m === "auto" && images.length > 0 && content) {
      const updated = blogImageModule.insertImagesIntoContent(content, images);

      const payload: Record<string, string> = { content: updated };
      if (images[0]) {
        payload.featured_image_url = images[0].url;
        payload.og_image_url = images[0].url;
      }

      await supabase.from("blog_posts").update(payload).eq("slug", blogSlug);
      console.log(`Blog post updated with ${images.length} images`);
    }

    return new Response(JSON.stringify({ success: true, images, mode: m }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-blog-images error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
