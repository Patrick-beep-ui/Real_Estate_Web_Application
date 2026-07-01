"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useBlogFilters } from "@/hooks/useBlogFilters";
import { useBlogSort } from "@/hooks/useBlogSort";
import { useBlogMutations } from "@/hooks/useBlogMutations";
import { useBlogEditor } from "@/hooks/useBlogEditor";
import { BlogStatsCards } from "@/components/admin/blogs/BlogStatsCards";
import { BlogToolbar } from "@/components/admin/blogs/BlogToolbar";
import { BlogPostTable } from "@/components/admin/blogs/BlogPostTable";
import { BlogPreviewModal } from "@/components/admin/blogs/BlogPreviewModal";
import { BlogEditModal } from "@/components/admin/blogs/BlogEditModal";
import { BlogDeleteDialog } from "@/components/admin/blogs/BlogDeleteDialog";
import type { BlogPost } from "@/types/blog";

const AdminBlogs = () => {
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-blogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data || []) as BlogPost[];
    },
  });

  const filters = useBlogFilters(posts);
  const { sortedPosts, sortConfig, requestSort } = useBlogSort(filters.filteredPosts);
  const mutations = useBlogMutations();
  const editor = useBlogEditor({
    saveEdit: mutations.saveEdit,
    createPost: mutations.createPost,
    generateBlogWithAI: mutations.generateBlogWithAI,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Blog Management</h1>
        <Button onClick={editor.openCreate} className="">
          <Plus className="w-4 h-4 mr-2" />
          New Blog Post
        </Button>
      </div>

      <BlogStatsCards posts={filters.filteredPosts} />

      <BlogToolbar
        search={filters.search}
        onSearchChange={filters.setSearch}
        filterCategory={filters.filterCategory}
        onFilterCategoryChange={filters.setFilterCategory}
        categories={filters.allCategories}
        statusFilter={filters.statusFilter}
        onStatusFilterChange={(v) => filters.setStatusFilter(v as "all" | "published" | "draft")}
        dateRange={filters.dateRange}
        onDateRangeChange={(range) => filters.setDateRange(range ?? {})}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <BlogPostTable
          posts={sortedPosts}
          sortConfig={sortConfig}
          onRequestSort={requestSort}
          onEdit={editor.openEdit}
          onDelete={(id) => setDeleteConfirm(id)}
          onStatusChange={(id, status) => mutations.updateStatus.mutate({ id, status })}
          onCategoryChange={(id, category) => mutations.updateCategory.mutate({ id, category })}
          onRegenerateImages={mutations.regenerateImages}
          generatingSlug={mutations.generatingSlug}
        />
      )}

      <BlogPreviewModal post={previewPost} onClose={() => setPreviewPost(null)} />

      <BlogEditModal editor={editor} />

      <BlogDeleteDialog
        postId={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm) {
            mutations.softDelete.mutate(deleteConfirm, {
              onSuccess: () => setDeleteConfirm(null),
            });
          }
        }}
        isPending={mutations.softDelete.isPending}
      />
    </div>
  );
};

export default AdminBlogs;
