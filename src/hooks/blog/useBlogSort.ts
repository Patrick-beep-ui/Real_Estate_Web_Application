"use client";

import { useState, useMemo } from "react";
import type { BlogPost } from "@/types/blog";

export function useBlogSort(posts: BlogPost[]) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const sortedPosts = useMemo(() => {
    const sorted = [...posts];
    if (!sortConfig) return sorted;
    sorted.sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      switch (sortConfig.key) {
        case "title":
          aVal = (a.title || "").toLowerCase();
          bVal = (b.title || "").toLowerCase();
          break;
        case "category":
          aVal = (a.category || "").toLowerCase();
          bVal = (b.category || "").toLowerCase();
          break;
        case "status":
          aVal = a.status || "";
          bVal = b.status || "";
          break;
        case "published_at":
          aVal = a.published_at ? new Date(a.published_at).getTime() : 0;
          bVal = b.published_at ? new Date(b.published_at).getTime() : 0;
          break;
        case "words":
          aVal = a.content ? a.content.split(/\s+/).length : 0;
          bVal = b.content ? b.content.split(/\s+/).length : 0;
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [posts, sortConfig]);

  const requestSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc" ? { key, direction: "desc" } : null;
      }
      return { key, direction: "asc" };
    });
  };

  return { sortedPosts, sortConfig, requestSort };
}
