"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useBlogPost, useBlogPosts } from "@/hooks/blog/useBlogPosts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeInView } from "@/components/blog/FadeInView";
import { BlogTableOfContents } from "@/components/blog/BlogTableOfContents";
import { BlogFAQ } from "@/components/blog/BlogFAQ";
import { RelatedBlogPosts } from "@/components/blog/RelatedBlogPosts";
import { InternalLinks } from "@/components/blog/InternalLinks";
import { Calendar, Clock, ArrowLeft, Share2, User } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import FinalCTA from "@/components/FinalCTA";
import { notFound } from "next/navigation";
import { resolveContent, cleanMarkdownContent, createHeadingId, stripFAQFromContent, extractFAQItems } from "@/lib/blog-utils";

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

interface BlogPostClientProps {
  slug: string;
}

export function BlogPostClient({ slug }: BlogPostClientProps) {
  const { data: post, isLoading, error } = useBlogPost(slug);

  // Mirror RelatedBlogPosts logic to compute which slugs it will show, so InternalLinks can exclude them and avoid duplication.
  const { data: categoryPosts } = useBlogPosts(post?.category || undefined);
  const { data: allPosts } = useBlogPosts();
  const relatedSlugs = useMemo(() => {
    if (!post) return [];
    const priority = (categoryPosts ?? [])
      .filter((p) => p.id !== post.id && p.slug !== post.slug)
      .slice(0, 3);
    const usedSlugs = new Set([post.slug, ...priority.map((p) => p.slug)]);
    const needed = 3 - priority.length;
    const fallback = needed > 0
      ? (allPosts ?? []).filter((p) => p.id !== post.id && !usedSlugs.has(p.slug)).slice(0, needed)
      : [];
    return [...priority, ...fallback].map((p) => p.slug);
  }, [post, categoryPosts, allPosts]);

  // SEO and Schema markup
  useEffect(() => {
    if (!post) return;

    const baseUrl = "https://tarekbuyshouses.com";
    const pageUrl = `${baseUrl}/blog/${post.slug}`;
    const ogImageUrl = post.featured_image_url || `${baseUrl}/og-image.jpg`;

    document.title = post.seo_title || `${post.title} | Tarek Buys Houses`;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", post.meta_description || post.excerpt || "");
    }

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = pageUrl;

    const ogTags = [
      { property: "og:title", content: post.title },
      { property: "og:description", content: post.meta_description || post.excerpt || "" },
      { property: "og:image", content: ogImageUrl },
      { property: "og:url", content: pageUrl },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: post.title },
      { name: "twitter:description", content: post.meta_description || post.excerpt || "" },
      { name: "twitter:image", content: ogImageUrl },
    ];

    ogTags.forEach((tag) => {
      let meta = document.querySelector(
        `meta[${tag.property ? "property" : "name"}="${tag.property || tag.name}"]`,
      );
      if (!meta) {
        meta = document.createElement("meta");
        if (tag.property) {
          meta.setAttribute("property", tag.property);
        } else {
          meta.setAttribute("name", tag.name!);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", tag.content);
    });

    let schemaData: object;

    if (post.schema_type === "HowTo") {
      const steps = post.content?.match(/## Step \d+:[\s\S]*?(?=## Step|\n## [^S]|$)/g) || [];
      schemaData = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: post.title,
        description: post.excerpt || post.meta_description,
        datePublished: post.published_at,
        dateModified: post.updated_at,
        author: {
          "@type": "Person",
          name: "Tarek El Moussa",
          url: `${baseUrl}/#tarek`,
        },
        publisher: {
          "@type": "Organization",
          name: "Tarek Buys Houses",
          logo: {
            "@type": "ImageObject",
            url: `${baseUrl}/og-image.jpg`,
          },
        },
        step: steps.map((step, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          text: step.replace(/## Step \d+:\s*/, "").trim(),
        })),
      };
    } else if (post.schema_type === "FAQPage") {
      const questions = post.content?.match(/## .+?\n[\s\S]+?(?=\n## |$)/g) || [];
      schemaData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: questions.map((qa) => {
          const lines = qa.split("\n");
          const question = lines[0].replace(/^##\s+/, "");
          const answer = lines.slice(1).join(" ").trim();
          return {
            "@type": "Question",
            name: question,
            acceptedAnswer: {
              "@type": "Answer",
              text: answer,
            },
          };
        }),
      };
    } else {
      schemaData = {
        "@context": "https://schema.org",
        "@type": post.schema_type === "BlogPosting" ? "BlogPosting" : "Article",
        headline: post.title,
        description: post.excerpt || post.meta_description,
        image: ogImageUrl,
        datePublished: post.published_at,
        dateModified: post.updated_at,
        author: {
          "@type": "Person",
          name: "Tarek El Moussa",
          url: `${baseUrl}/#tarek`,
          description: "Host of HGTV's Flip or Flop with 20+ years of real estate investing experience. Expert in buying houses for cash and helping homeowners sell fast.",
        },
        publisher: {
          "@type": "Organization",
          name: "Tarek Buys Houses",
          logo: {
            "@type": "ImageObject",
            url: `${baseUrl}/og-image.jpg`,
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": pageUrl,
        },
      };
    }

    const existingScript = document.querySelector('script[data-blog-schema]');
    if (existingScript) existingScript.remove();

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-blog-schema", "true");
    script.textContent = JSON.stringify(schemaData);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[data-blog-schema]');
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, [post]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-8" />
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

  if (error || !post) {
    notFound();
  }

  const resolvedContent = resolveContent(post.content || "");
  const wordCount = resolvedContent.split(/\s+/).length || 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16">
        <article className="container mx-auto px-4 max-w-4xl">
          <FadeInView>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>

            <div className="flex flex-wrap items-center gap-4 mb-4">
              <Badge variant="outline">
                {formatCategoryLabel(post.category)}
              </Badge>
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
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
              {post.title}
            </h1>

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
          </FadeInView>

          {post.featured_image_url && (
            <FadeInView delay={0.1}>
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full rounded-xl mb-8 shadow-lg"
              />
            </FadeInView>
          )}

          <BlogTableOfContents content={resolvedContent} />

          <FadeInView delay={0.15}>
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
                  img: (props) => {
                    const src = props.src || "";
                    return (
                      <img
                        src={src}
                        alt={props.alt || ""}
                        className="rounded-lg my-8 mx-auto max-w-full md:max-w-[80%] h-auto shadow-md"
                        loading="lazy"
                      />
                    );
                  },
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
                {cleanMarkdownContent(stripFAQFromContent(resolvedContent)
                  .replace(/<script[\s\S]*?<\/script>/gi, "")
                  .trim())}
              </ReactMarkdown>
            </div>
          </FadeInView>

          <FadeInView delay={0.2}>
            <div className="flex items-center gap-4 mt-12 pt-8 border-t border-border">
              <span className="text-sm font-medium text-foreground">Share this article:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.share?.({
                    title: post.title,
                    url: window.location.href,
                  });
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </FadeInView>

          {resolvedContent && (
            <BlogFAQ
              faqItems={extractFAQItems(resolvedContent)}
              postTitle={post.title}
            />
          )}

          <RelatedBlogPosts
            currentPostId={post.id}
            category={post.category}
            currentPostSlug={post.slug}
          />

          <InternalLinks
            currentBlogSlug={post.slug}
            currentCategory={post.category}
            excludeSlugs={relatedSlugs}
          />
        </article>

        <FinalCTA />
      </main>
    </div>
  );
}
