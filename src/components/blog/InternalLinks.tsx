"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { scrubBlogPost } from "@/lib/blog/utils";
import { ArrowRight, FileText } from "lucide-react";
import { FadeInView } from "@/components/blog/FadeInView";

interface InternalLinksProps {
  currentBlogSlug?: string;
  currentCategory?: string | null;
  excludeSlugs?: string[];
  maxLinks?: number;
}

export function InternalLinks({
  currentBlogSlug,
  currentCategory,
  excludeSlugs = [],
  maxLinks = 6,
}: InternalLinksProps) {
  const { data: blogPosts } = useQuery({
    queryKey: ["internal-links-blogs", currentBlogSlug, currentCategory],
    queryFn: async () => {
      // Fetch extra to account for client-side exclusions
      const fetchLimit = maxLinks + excludeSlugs.length + 3;
      let query = supabase
        .from("blog_posts")
        .select("slug, title")
        .eq("status", "published")
        .neq("slug", currentBlogSlug || "")
        .order("published_at", { ascending: false })
        .limit(fetchLimit);

      // Cross-category: show posts from other categories to complement Related Articles
      if (currentCategory) {
        query = query.neq("category", currentCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((post) => scrubBlogPost(post));
    },
    enabled: !!currentBlogSlug,
  });

  // Client-side exclusion of posts already shown in Related Articles
  const excludeSet = new Set(excludeSlugs);
  const filteredPosts = (blogPosts ?? [])
    .filter((p) => !excludeSet.has(p.slug))
    .slice(0, maxLinks);

  if (filteredPosts.length === 0) return null;

  return (
    <FadeInView>
      <div className="bg-muted/50 border border-border rounded-xl p-6 my-8">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent" />
          More Helpful Guides
        </h3>

        <ul className="space-y-2">
          {filteredPosts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="text-accent hover:text-accent/80 hover:underline inline-flex items-center gap-1 text-sm"
              >
                {post.title.length > 50
                  ? post.title.substring(0, 50) + "..."
                  : post.title}
                <ArrowRight className="w-3 h-3" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </FadeInView>
  );
}
