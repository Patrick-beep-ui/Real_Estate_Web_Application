"use client";

import Link from "next/link";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { FadeInView } from "@/components/blog/FadeInView";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface RelatedBlogPostsProps {
  currentPostId: string;
  category: string | null;
  currentPostSlug: string;
}

const formatCategoryLabel = (category: string | null): string => {
  if (!category) return "";
  const labels: Record<string, string> = {
    "seller-guides": "Seller Guides",
    "tips-advice": "Tips & Advice",
    "market-insights": "Market Insights",
    "success-stories": "Success Stories",
    guides: "Guides",
  };
  return labels[category] || category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export function RelatedBlogPosts({
  currentPostId,
  category,
  currentPostSlug,
}: RelatedBlogPostsProps) {
  const { data: categoryPosts, isLoading: loadingCategory } = useBlogPosts(category || undefined);
  const { data: allPosts, isLoading: loadingAll } = useBlogPosts();
  const isLoading = loadingCategory || loadingAll;

  if (isLoading) {
    return (
      <section className="mt-16 pt-12 border-t border-border">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
          Related Articles
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Priority: same-category posts
  const priorityPosts = (categoryPosts ?? [])
    .filter((p) => p.id !== currentPostId && p.slug !== currentPostSlug)
    .slice(0, 3);

  // Fallback: fill remaining slots with most recent posts from any category
  const needed = 3 - priorityPosts.length;
  const usedSlugs = new Set([currentPostSlug, ...priorityPosts.map((p) => p.slug)]);
  const fallbackPosts = needed > 0
    ? (allPosts ?? [])
        .filter((p) => p.id !== currentPostId && !usedSlugs.has(p.slug))
        .slice(0, needed)
    : [];

  const relatedPosts = [...priorityPosts, ...fallbackPosts];

  if (relatedPosts.length === 0) return null;

  return (
    <FadeInView delay={0.3}>
      <section className="mt-16 pt-12 border-t border-border">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
          Related Articles
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {relatedPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col h-full rounded-lg border border-border hover:border-accent hover:shadow-lg transition-all duration-300 overflow-hidden bg-background"
            >
              {post.featured_image_url ? (
                <div className="relative h-40 overflow-hidden bg-muted">
                  <img
                    src={post.featured_image_url}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="h-40 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <div className="text-muted-foreground text-sm">No image</div>
                </div>
              )}

              <div className="flex flex-col flex-1 p-4">
                {post.category && (
                  <span className="text-xs font-medium text-accent mb-2">
                    {formatCategoryLabel(post.category)}
                  </span>
                )}

                <h3 className="font-bold text-foreground mb-3 line-clamp-2 group-hover:text-accent transition-colors">
                  {post.title}
                </h3>

                {post.excerpt && (() => {
                  const excerptRaw = post.excerpt;
                  const stripped = excerptRaw
                    .replace(/^```(?:json)?\s*/i, "")
                    .replace(/\s*```\s*$/i, "")
                    .trim();
                  let displayExcerpt = excerptRaw;
                  if (stripped.startsWith("{")) {
                    const extractField = (src: string, field: string): string | null => {
                      const km = src.match(new RegExp(`"${field}"\\s*:\\s*"`));
                      if (!km) return null;
                      const s = (km.index ?? 0) + km[0].length;
                      let e = s; let esc = false;
                      while (e < src.length) {
                        const c = src[e];
                        if (esc) { esc = false; }
                        else if (c === "\\") { esc = true; }
                        else if (c === '"') { break; }
                        e++;
                      }
                      return src.slice(s, e).replace(/\\n/g, " ").replace(/\\"/g, '"').trim();
                    };
                    const ex = extractField(stripped, "excerpt");
                    if (ex) {
                      displayExcerpt = ex;
                    } else {
                      const ct = extractField(stripped, "content");
                      if (ct) {
                        const body = ct.replace(/^.*?\s{2,}/, "").trim();
                        displayExcerpt = (body || ct).substring(0, 200) + "…";
                      }
                    }
                  }
                  return (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                      {displayExcerpt}
                    </p>
                  );
                })()}

                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-4 pt-4 border-t border-border/50">
                  {post.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(post.published_at), "MMM d")}
                    </span>
                  )}
                  {post.content && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200))} min
                    </span>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full group-hover:bg-accent group-hover:text-accent-foreground transition-colors"
                >
                  Read More
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </FadeInView>
  );
}
