import { supabase } from "@/lib/supabase/client";
import { BlogPostClient } from "@/components/blog/BlogPostClient";
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

  return {
    title: post.seo_title || `${post.title} | Tarek Buys Houses`,
    description: post.meta_description || post.excerpt || "",
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.meta_description || post.excerpt || "",
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
