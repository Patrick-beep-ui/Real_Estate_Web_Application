"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BlogMarkdown } from "@/lib/blog-markdown";
import { BlogFAQ } from "@/components/blog/BlogFAQ";
import { resolveContent, extractFAQItems, stripFAQFromContent } from "@/lib/blog-utils";
import { CATEGORY_LABELS } from "@/types/blog";
import type { BlogPost } from "@/types/blog";

interface BlogPreviewModalProps {
  post: BlogPost | null;
  onClose: () => void;
}

function wordCount(content: string | null) {
  if (!content) return 0;
  return content.split(/\s+/).length;
}

function readTime(content: string | null) {
  return Math.max(1, Math.ceil(wordCount(content) / 200));
}

export function BlogPreviewModal({ post, onClose }: BlogPreviewModalProps) {
  return (
    <Dialog open={!!post} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        {post && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{post.title}</DialogTitle>
              <DialogDescription className="space-y-1">
                <div className="flex flex-wrap gap-2 text-xs">
                  {post.category && (
                    <Badge variant="outline" className="text-[10px]">
                      {CATEGORY_LABELS[post.category] || post.category}
                    </Badge>
                  )}
                  {post.schema_type && (
                    <Badge variant="outline" className="text-[10px]">
                      {post.schema_type}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      post.status === "published"
                        ? "border-green-500/40 text-green-500"
                        : "border-yellow-500/40 text-yellow-500"
                    }`}
                  >
                    {post.status}
                  </Badge>
                  <span className="text-muted-foreground">
                    {wordCount(post.content).toLocaleString()} words &middot; {readTime(post.content)} min read
                  </span>
                </div>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground mt-2 italic">{post.excerpt}</p>
                )}
                {post.meta_description && (
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    <span className="font-medium">SEO:</span> {post.meta_description}
                  </p>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="border-t border-border pt-4 mt-2">
              {post.seo_title && (
                <p className="text-xs text-muted-foreground mb-2">
                  <span className="font-medium">SEO Title:</span> {post.seo_title}
                </p>
              )}
              {post.featured_image_url && (
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full max-h-64 object-cover rounded-lg mb-4"
                />
              )}
              <BlogMarkdown content={stripFAQFromContent(resolveContent(post.content || ""))} />
              {post.content && (() => {
                const resolved = resolveContent(post.content);
                const items = extractFAQItems(resolved);
                if (items.length === 0) return null;
                return (
                  <div className="mt-8">
                    <BlogFAQ faqItems={items} postTitle={post.title} />
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
