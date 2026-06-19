"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { ArrowRight, FileText } from "lucide-react";
import { FadeInView } from "@/components/blog/FadeInView";

interface InternalLinksProps {
  currentBlogSlug?: string;
  maxLinks?: number;
}

export function InternalLinks({
  currentBlogSlug,
  maxLinks = 6,
}: InternalLinksProps) {
  const { data: blogPosts } = useQuery({
    queryKey: ["internal-links-blogs", currentBlogSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug, title")
        .eq("status", "published")
        .neq("slug", currentBlogSlug || "")
        .limit(maxLinks);

      if (error) throw error;
      return data;
    },
    enabled: !!currentBlogSlug,
  });

  if (!blogPosts || blogPosts.length === 0) return null;

  return (
    <FadeInView>
      <div className="bg-muted/50 border border-border rounded-xl p-6 my-8">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent" />
          More Helpful Guides
        </h3>

        <ul className="space-y-2">
          {blogPosts.slice(0, maxLinks).map((post) => (
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
