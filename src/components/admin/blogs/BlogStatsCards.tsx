"use client";

import { useMemo } from "react";
import { Image } from "lucide-react";
import type { BlogPost } from "@/types/blog";

interface BlogStatsCardsProps {
  posts: BlogPost[];
}

function StatCard({ label, value, color, icon }: { label: string; value: string; color?: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <div className={`text-xl font-bold ${color || "text-foreground"}`}>{value}</div>
    </div>
  );
}

export function BlogStatsCards({ posts }: BlogStatsCardsProps) {
  const stats = useMemo(() => {
    return {
      total: posts.length,
      published: posts.filter((p) => p.status === "published").length,
      draft: posts.filter((p) => p.status === "draft").length,
      archived: posts.filter((p) => p.status === "archived").length,
      withImages: posts.filter((p) => p.featured_image_url).length,
    };
  }, [posts]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <StatCard label="Total Posts" value={stats.total.toString()} />
      <StatCard label="Published" value={stats.published.toString()} color="text-green-500" />
      <StatCard label="Drafts" value={stats.draft.toString()} color="text-yellow-500" />
      <StatCard label="Archived" value={stats.archived.toString()} color="text-muted-foreground" />
      <StatCard label="With Images" value={stats.withImages.toString()} icon={<Image className="w-3 h-3" />} />
    </div>
  );
}
