"use client";

import { useState, useMemo } from "react";
import type { TestimonialRow } from "@/types/testimonial";

export function useTestimonialFilters(posts: TestimonialRow[]) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft" | "archived">("all");
  const [filterScenario, setFilterScenario] = useState<string>("all");

  const filteredPosts = useMemo(() => {
    return posts.filter((t) => {
      const s = search.toLowerCase();
      const matchesSearch =
        !search ||
        t.name.toLowerCase().includes(s) ||
        (t.body || "").toLowerCase().includes(s) ||
        (t.location || "").toLowerCase().includes(s);

      const matchesStatus =
        filterStatus === "all" || t.status === filterStatus;

      const matchesScenario =
        filterScenario === "all" || t.scenario === filterScenario;

      return matchesSearch && matchesStatus && matchesScenario;
    });
  }, [posts, search, filterStatus, filterScenario]);

  const allScenarios = useMemo(() => {
    const set = new Set(posts.map((t) => t.scenario).filter((s): s is string => !!s));
    return Array.from(set).sort();
  }, [posts]);

  return {
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterScenario,
    setFilterScenario,
    filteredPosts,
    allScenarios,
  };
}
