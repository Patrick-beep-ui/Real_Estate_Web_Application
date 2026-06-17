import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { TOPIC_CATEGORIES } from "../data/blog-topics.ts";

export async function selectTodaysTopic(
  supabase: ReturnType<typeof createClient>
): Promise<{ title: string; category: string } | null> {
  const { data: existingPosts } = await supabase
    .from("blog_posts")
    .select("slug, title");

  const existingTitles = new Set(
    (existingPosts || []).map((p) => p.title.toLowerCase())
  );

  const availableTopics: { title: string; category: string }[] = [];

  for (const cat of TOPIC_CATEGORIES) {
    for (const title of cat.topics) {
      if (!existingTitles.has(title.toLowerCase())) {
        availableTopics.push({ title, category: cat.category });
      }
    }
  }

  if (availableTopics.length === 0) return null;

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000
  );

  return availableTopics[dayOfYear % availableTopics.length];
}
