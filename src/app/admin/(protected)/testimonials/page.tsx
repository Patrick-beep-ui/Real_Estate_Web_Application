"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus } from "lucide-react";
import { useTestimonialFilters } from "@/hooks/testimonials/useTestimonialFilters";
import { useTestimonialMutations } from "@/hooks/testimonials/useTestimonialMutations";
import { TestimonialStatsCards } from "@/components/admin/testimonials/TestimonialStatsCards";
import { TestimonialToolbar } from "@/components/admin/testimonials/TestimonialToolbar";
import { TestimonialTable } from "@/components/admin/testimonials/TestimonialTable";
import { TestimonialEditModal } from "@/components/admin/testimonials/TestimonialEditModal";
import { TestimonialDeleteDialog } from "@/components/admin/testimonials/TestimonialDeleteDialog";
import { TestimonialSectionsManager } from "@/components/admin/testimonials/TestimonialSectionsManager";
import type { TestimonialRow } from "@/types/testimonial";

type TestimonialRowWithPoints = TestimonialRow & {
  points: string[];
  testimonial_points: { point: string; sort_order: number | null }[];
};

const AdminTestimonials = () => {
  const [tab, setTab] = useState<"list" | "sections">("list");
  const [editPost, setEditPost] = useState<TestimonialRowWithPoints | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: () => adminApi.get<{ items: TestimonialRowWithPoints[] }>("/api/admin/testimonials").then((data) => data.items),
  });

  const filters = useTestimonialFilters(posts);
  const mutations = useTestimonialMutations();

  const sortedPosts = [...filters.filteredPosts].sort((a, b) => {
    if (!sortConfig) return 0;
    let aVal: string | number = "";
    let bVal: string | number = "";
    switch (sortConfig.key) {
      case "name":
        aVal = (a.name || "").toLowerCase();
        bVal = (b.name || "").toLowerCase();
        break;
      case "kind":
        aVal = a.kind || "";
        bVal = b.kind || "";
        break;
      case "scenario":
        aVal = (a.scenario || "").toLowerCase();
        bVal = (b.scenario || "").toLowerCase();
        break;
      case "status":
        aVal = a.status || "";
        bVal = b.status || "";
        break;
      default:
        return 0;
    }
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const requestSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc" ? { key, direction: "desc" } : null;
      }
      return { key, direction: "asc" };
    });
  };

  const openCreate = () => {
    setEditPost(null);
    setCreating(true);
  };

  const openEdit = (post: TestimonialRow) => {
    setEditPost(post as TestimonialRowWithPoints);
    setCreating(false);
  };

  const closeEditor = () => {
    setEditPost(null);
    setCreating(false);
  };

  const handleSave = (form: Record<string, unknown>) => {
    if (creating) {
      mutations.createTestimonial.mutate(form, {
        onSuccess: () => closeEditor(),
      });
    } else if (editPost) {
      mutations.updateTestimonial.mutate({ id: editPost.id, form }, {
        onSuccess: () => closeEditor(),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Testimonial Management</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Testimonial
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "list" | "sections")}>
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <TestimonialStatsCards posts={filters.filteredPosts} />

          <TestimonialToolbar
            search={filters.search}
            onSearchChange={filters.setSearch}
            filterStatus={filters.filterStatus}
            onFilterStatusChange={(v) => filters.setFilterStatus(v as "all" | "published" | "draft" | "archived")}
            filterScenario={filters.filterScenario}
            onFilterScenarioChange={filters.setFilterScenario}
            scenarios={filters.allScenarios}
          />

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <TestimonialTable
              posts={sortedPosts}
              sortConfig={sortConfig}
              onRequestSort={requestSort}
              onEdit={openEdit}
              onDelete={(id) => setDeleteConfirm(id)}
              onToggleFeatured={(id) => {
                const post = posts.find((item) => item.id === id);
                if (post) mutations.toggleFeatured.mutate({ id, isFeatured: !(post.is_featured ?? false) });
              }}
            />
          )}

          <TestimonialEditModal
            editPost={editPost}
            creating={creating}
            isPending={mutations.createTestimonial.isPending || mutations.updateTestimonial.isPending}
            onSave={handleSave}
            onClose={closeEditor}
          />

          <TestimonialDeleteDialog
            testimonialId={deleteConfirm}
            onClose={() => setDeleteConfirm(null)}
            onConfirm={() => {
              if (deleteConfirm) {
                const post = posts.find((item) => item.id === deleteConfirm);
                if (post) mutations.deleteTestimonial.mutate(post, {
                  onSuccess: () => setDeleteConfirm(null),
                });
              }
            }}
            isPending={mutations.deleteTestimonial.isPending}
          />
        </TabsContent>

        <TabsContent value="sections">
          <TestimonialSectionsManager published={posts} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTestimonials;
