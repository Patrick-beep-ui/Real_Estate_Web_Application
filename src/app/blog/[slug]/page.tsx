import { supabase } from "@/lib/supabase/client";
import { BlogPostClient } from "@/components/blog/BlogPostClient";
import { scrubBlogPost } from "@/lib/blog/utils";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const { data } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("status", "published");

  return (data || []).map((post) => ({ slug: post.slug }));
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, seo_title, meta_description, excerpt, slug, published_at, featured_image_url")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!post) return { title: "Blog Post Not Found" };

  // The 24-hour offer claim is scrubbed on read, not in the stored row. It has
  // to happen here too: this is a separate query from the client hook, and
  // meta_description is served straight to crawlers.
  const meta = scrubBlogPost(post);

  return {
    title: meta.seo_title || `${meta.title} | Tarek Buys Houses`,
    description: meta.meta_description || meta.excerpt || "",
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: meta.title,
      description: meta.meta_description || meta.excerpt || "",
      type: "article",
      publishedTime: post.published_at || undefined,
      images: post.featured_image_url ? [{ url: post.featured_image_url }] : [],
    },
  };
}

export const revalidate = 3600;

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  return <BlogPostClient slug={slug} />;
}
