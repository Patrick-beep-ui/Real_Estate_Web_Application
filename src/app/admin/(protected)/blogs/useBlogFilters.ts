"use client";

import { useState, useMemo } from "react";

export interface BlogPost {
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
  ai_generated: boolean | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  tags: string[] | null;
  canonical_url: string | null;
  author_id: string | null;
  location_id: string | null;
}

export function useBlogFilters(posts: BlogPost[] | undefined) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    return posts.filter((post) => {
      const s = search.toLowerCase();
      const matchesSearch =
        !search ||
        post.title.toLowerCase().includes(s) ||
        post.slug.toLowerCase().includes(s) ||
        (post.category || "").toLowerCase().includes(s);

      const matchesCategory =
        filterCategory === "all" || post.category === filterCategory;

      const postDate = post.published_at
        ? new Date(post.published_at)
        : null;
      const from = dateRange.from
        ? new Date(
            dateRange.from.getFullYear(),
            dateRange.from.getMonth(),
            dateRange.from.getDate()
          )
        : null;
      const to = dateRange.to
        ? new Date(
            dateRange.to.getFullYear(),
            dateRange.to.getMonth(),
            dateRange.to.getDate(),
            23,
            59,
            59,
            999
          )
        : null;
      const matchesDate =
        (!from || (postDate && postDate >= from)) &&
        (!to || (postDate && postDate <= to));

      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [posts, search, filterCategory, dateRange]);

  return {
    filteredPosts,
    search,
    setSearch,
    filterCategory,
    setFilterCategory,
    dateRange,
    setDateRange,
  };
}
