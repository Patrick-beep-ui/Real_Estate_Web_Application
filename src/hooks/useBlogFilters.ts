"use client";

import { useState, useMemo } from "react";
import { CATEGORIES, CATEGORY_LABELS } from "@/types/blog";
import type { BlogPost } from "@/types/blog";

export function useBlogFilters(posts: BlogPost[]) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const filteredPosts = useMemo(() => {
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

  const allCategories = useMemo(() => {
    const staticList = CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] || c }));
    const dbSet = new Set(posts.map((p) => p.category).filter((c): c is string => !!c));
    const dynamic = Array.from(dbSet).map((value) => {
      const known = staticList.find((s) => s.value === value);
      return known ?? { value, label: value };
    });
    const seen = new Set(dynamic.map((c) => c.value));
    return [...dynamic, ...staticList.filter((s) => !seen.has(s.value))];
  }, [posts]);

  return {
    filteredPosts,
    allCategories,
    search,
    setSearch,
    filterCategory,
    setFilterCategory,
    dateRange,
    setDateRange,
  };
}
