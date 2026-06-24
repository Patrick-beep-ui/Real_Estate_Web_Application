"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft, Eye } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { resolveContent, cleanMarkdownContent, createHeadingId } from "@/lib/blog-utils";
import Link from "next/link";

const CATEGORY_LABELS: Record<string, string> = {
  "seller-guides": "Seller Guides",
  "market-trends": "Market Trends",
  "cash-offers": "Cash Offers",
  "real-estate-tips": "Real Estate Tips",
  "local-insights": "Local Insights",
};

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  meta_description: string | null;
  seo_title: string | null;
  featured_image_url: string | null;
  og_image_url: string | null;
  category: string | null;
  schema_type: string | null;
  status: string | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export default function BlogPreview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const { data: post, isLoading } = useQuery({
    queryKey: ["admin-blog-preview", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as BlogPost | null;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-12 pb-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-5 w-1/2 mb-8" />
            <Skeleton className="h-64 w-full mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Eye className="w-12 h-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">Blog post not found</h2>
          <p className="text-muted-foreground">No post exists with the slug &quot;{slug}&quot;</p>
          <Link href="/admin/blogs">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blogs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const resolvedContent = resolveContent(post.content || "");
  const wordCount = resolvedContent.split(/\s+/).length || 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen bg-background">
      {/* Preview banner */}
      <div className="sticky top-0 z-50 bg-accent/10 border-b border-accent/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 max-w-4xl flex items-center justify-between h-10">
          <div className="flex items-center gap-2 text-xs text-accent font-medium">
            <Eye className="w-3.5 h-3.5" />
            Preview Mode
            <Badge
              variant="outline"
              className={`text-[10px] ml-1 ${
                post.status === "published"
                  ? "border-green-500/40 text-green-500"
                  : post.status === "draft"
                  ? "border-yellow-500/40 text-yellow-500"
                  : "border-muted-foreground/40 text-muted-foreground"
              }`}
            >
              {post.status || "draft"}
            </Badge>
          </div>
          <Link href="/admin/blogs">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
              <ArrowLeft className="w-3 h-3" />
              Back to Blogs
            </Button>
          </Link>
        </div>
      </div>

      <main className="pb-16">
        <article className="container mx-auto px-4 max-w-4xl">
          <div className="pt-8 pb-4">
            <Link
              href="/admin/blogs"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent mb-6 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blogs
            </Link>

            <div className="flex flex-wrap items-center gap-4 mb-4">
              {post.category && (
                <Badge variant="outline">
                  {CATEGORY_LABELS[post.category] || post.category}
                </Badge>
              )}
              {post.schema_type && (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  {post.schema_type}
                </Badge>
              )}
              {post.published_at && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(post.published_at), "MMMM d, yyyy")}
                </span>
              )}
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {readingTime} min read
              </span>
              <span className="text-xs text-muted-foreground/60">
                {wordCount.toLocaleString()} words
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-lg text-muted-foreground mb-6 italic">{post.excerpt}</p>
            )}

            <div className="flex items-center gap-3 mb-8 pb-8 border-b border-border">
              <img
                src="/images/tarek-portrait.webp"
                alt="Tarek El Moussa"
                className="w-12 h-12 rounded-full object-cover object-top"
              />
              <div>
                <p className="font-semibold text-foreground">Tarek El Moussa</p>
                <p className="text-sm text-muted-foreground">
                  Host of HGTV&apos;s <em>Flip or Flop</em> &middot; 20+ Years in Real Estate
                </p>
              </div>
            </div>
          </div>

          {post.featured_image_url && (
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full rounded-xl mb-8 shadow-lg"
            />
          )}

          <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-accent hover:prose-a:text-accent/80 prose-li:text-muted-foreground prose-blockquote:border-accent prose-blockquote:text-muted-foreground">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children, ...props }) => {
                  const clean = (child: React.ReactNode): React.ReactNode =>
                    typeof child === "string" ? child.replace(/^#{1,6}\s+/, "") : child;
                  const cleaned = Array.isArray(children) ? children.map(clean) : clean(children);
                  const text = String(children).trim().replace(/^#{1,6}\s+/, "");
                  const id = createHeadingId(text);
                  return (
                    <h2
                      id={id}
                      className="text-3xl md:text-4xl font-bold text-foreground mt-12 mb-6 scroll-mt-24"
                      {...props}
                    >
                      {cleaned}
                    </h2>
                  );
                },
                h2: ({ children, ...props }) => {
                  const clean = (child: React.ReactNode): React.ReactNode =>
                    typeof child === "string" ? child.replace(/^#{1,6}\s+/, "") : child;
                  const cleaned = Array.isArray(children) ? children.map(clean) : clean(children);
                  const text = String(children).trim().replace(/^#{1,6}\s+/, "");
                  const id = createHeadingId(text);
                  return (
                    <h3
                      id={id}
                      className="text-xl md:text-2xl font-semibold text-foreground mt-8 mb-3 pl-4 border-l-4 border-accent scroll-mt-24"
                      {...props}
                    >
                      {cleaned}
                    </h3>
                  );
                },
                h3: ({ children, ...props }) => {
                  const clean = (child: React.ReactNode): React.ReactNode =>
                    typeof child === "string" ? child.replace(/^#{1,6}\s+/, "") : child;
                  const cleaned = Array.isArray(children) ? children.map(clean) : clean(children);
                  const text = String(children).trim().replace(/^#{1,6}\s+/, "");
                  const id = createHeadingId(text);
                  return (
                    <h4
                      id={id}
                      className="text-xl md:text-2xl font-semibold text-foreground mt-8 mb-3 scroll-mt-24"
                      {...props}
                    >
                      {cleaned}
                    </h4>
                  );
                },
                p: ({ children, ...props }) => {
                  const clean = (child: React.ReactNode): React.ReactNode =>
                    typeof child === "string" ? child.replace(/^#{1,6}\s+/, "") : child;
                  const cleaned = Array.isArray(children) ? children.map(clean) : clean(children);
                  return (
                    <p className="my-4 text-lg leading-relaxed text-muted-foreground" {...props}>
                      {cleaned}
                    </p>
                  );
                },
                a: ({ href, children, ...props }) => (
                  <a
                    href={href?.replace(/\/locations\//g, "/markets/")}
                    className="text-accent hover:text-accent/80 underline underline-offset-4 transition-colors"
                    {...props}
                  >
                    {children}
                  </a>
                ),
                strong: ({ children, ...props }) => (
                  <strong className="font-bold text-foreground" {...props}>
                    {children}
                  </strong>
                ),
                em: ({ children, ...props }) => (
                  <em className="italic" {...props}>
                    {children}
                  </em>
                ),
                blockquote: ({ children, ...props }) => (
                  <blockquote
                    className="border-l-4 border-accent pl-6 py-2 my-6 italic text-muted-foreground bg-accent/5 rounded-r-lg"
                    {...props}
                  >
                    {children}
                  </blockquote>
                ),
                ul: ({ children, ...props }) => (
                  <ul className="list-disc list-outside pl-6 my-6 space-y-3 text-muted-foreground marker:text-accent" {...props}>
                    {children}
                  </ul>
                ),
                ol: ({ children, ...props }) => (
                  <ol className="list-decimal list-outside pl-6 my-6 space-y-3 text-muted-foreground marker:text-accent marker:font-semibold" {...props}>
                    {children}
                  </ol>
                ),
                li: ({ children, ...props }) => (
                  <li className="text-lg leading-relaxed pl-1" {...props}>
                    {children}
                  </li>
                ),
                img: (props) => (
                  <img
                    src={props.src || ""}
                    alt={props.alt || ""}
                    className="rounded-lg my-8 mx-auto max-w-full md:max-w-[80%] h-auto shadow-md"
                    loading="lazy"
                  />
                ),
                hr: (props) => (
                  <hr className="my-12 border-border" {...props} />
                ),
                table: ({ children, ...props }) => (
                  <div className="overflow-x-auto my-8">
                    <table className="w-full border-collapse text-left text-sm md:text-base" {...props}>
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children, ...props }) => (
                  <thead className="bg-accent/10" {...props}>
                    {children}
                  </thead>
                ),
                tbody: ({ children, ...props }) => (
                  <tbody className="divide-y divide-border" {...props}>
                    {children}
                  </tbody>
                ),
                tr: ({ children, ...props }) => (
                  <tr className="hover:bg-accent/5 transition-colors" {...props}>
                    {children}
                  </tr>
                ),
                th: ({ children, ...props }) => (
                  <th className="px-4 py-3 font-semibold text-foreground border-b-2 border-accent" {...props}>
                    {children}
                  </th>
                ),
                td: ({ children, ...props }) => (
                  <td className="px-4 py-3 text-muted-foreground" {...props}>
                    {children}
                  </td>
                ),
              }}
            >
              {cleanMarkdownContent(resolvedContent
                .replace(/<script[\s\S]*?<\/script>/gi, "")
                .trim())}
            </ReactMarkdown>
          </div>
        </article>
      </main>
    </div>
  );
}
