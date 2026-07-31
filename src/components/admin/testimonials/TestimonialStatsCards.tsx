"use client";

import { useMemo } from "react";
import type { TestimonialRow } from "@/types/testimonial";

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-bold ${color || "text-foreground"}`}>{value}</p>
    </div>
  );
}

export function TestimonialStatsCards({ posts }: { posts: TestimonialRow[] }) {
  const stats = useMemo(() => ({
    total: posts.length,
    published: posts.filter((t) => t.status === "published").length,
    draft: posts.filter((t) => t.status === "draft").length,
    featured: posts.filter((t) => t.is_featured).length,
  }), [posts]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Total" value={stats.total.toString()} />
      <StatCard label="Published" value={stats.published.toString()} color="text-green-500" />
      <StatCard label="Drafts" value={stats.draft.toString()} color="text-yellow-500" />
      <StatCard label="Featured" value={stats.featured.toString()} color="text-blue-500" />
    </div>
  );
}
