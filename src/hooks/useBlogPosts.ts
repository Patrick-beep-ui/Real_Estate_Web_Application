import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

export type BlogPost = Tables<"blog_posts">;

export function useBlogPost(slug: string | undefined) {
  return useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (error) throw error;
      return data as BlogPost | null;
    },
    enabled: !!slug,
  });
}

export function useBlogPosts(category?: string) {
  return useQuery({
    queryKey: ["blog-posts", category],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BlogPost[];
    },
  });
}

export function useBlogCategories() {
  return useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("category")
        .eq("status", "published")
        .not("category", "is", null);

      if (error) throw error;

      const unique = Array.from(new Set((data ?? []).map((r) => r.category as string)))
        .filter(Boolean)
        .sort();

      return unique;
    },
  });
}
