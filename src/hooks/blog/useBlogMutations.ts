"use client";

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/api";
import { supabase } from "@/lib/supabase/client";
import { SUPABASE_URL } from "@/lib/shared/env";
import { useToast } from "@/hooks/shared/use-toast";
import type { BlogPost } from "@/types/blog";

export function useBlogMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [generatingSlug, setGeneratingSlug] = useState<string | null>(null);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
    queryClient.invalidateQueries({ queryKey: ["admin-blog-preview"] });
  }, [queryClient]);

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.patch(`/api/admin/blogs/${id}`, { status }),
    onSuccess: () => { invalidate(); toast({ title: "Status updated" }); },
    onError: (err) => { toast({ variant: "destructive", title: "Error", description: (err as Error).message }); },
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, category }: { id: string; category: string }) =>
      adminApi.patch(`/api/admin/blogs/${id}`, { category }),
    onSuccess: () => { invalidate(); toast({ title: "Category updated" }); },
    onError: (err) => { toast({ variant: "destructive", title: "Error", description: (err as Error).message }); },
  });

  const saveEdit = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: Record<string, unknown> }) => {
      await adminApi.patch(`/api/admin/blogs/${id}`, form);
    },
    onSuccess: () => { invalidate(); toast({ title: "Blog updated" }); },
    onError: (err) => { toast({ variant: "destructive", title: "Error", description: (err as Error).message }); },
  });

  const softDelete = useMutation({
    mutationFn: (id: string) => adminApi.patch(`/api/admin/blogs/${id}`, { status: "archived" }),
    onSuccess: () => { invalidate(); toast({ title: "Blog archived" }); },
    onError: (err) => { toast({ variant: "destructive", title: "Error", description: (err as Error).message }); },
  });

  const createPost = useMutation({
    mutationFn: async (form: Record<string, unknown>) => {
      await adminApi.post("/api/admin/blogs", form);
    },
    onSuccess: () => { invalidate(); toast({ title: "Blog created" }); },
    onError: (err) => { toast({ variant: "destructive", title: "Error", description: (err as Error).message }); },
  });

  const generateBlogWithAI = useMutation({
    mutationFn: async ({ title, category }: { title: string; category?: string }) => {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/generate-blog-content`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title, category }),
        }
      );
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || "AI generation failed");
      return result.post;
    },
    onSuccess: (data) => {
      invalidate();
      toast({ title: `Blog post "${data.title}" generated via AI` });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "AI generation failed", description: (err as Error).message });
    },
  });

  const regenerateImages = useCallback(async (blog: BlogPost) => {
    setGeneratingSlug(blog.slug);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/generate-blog-images`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ blogSlug: blog.slug, mode: "auto" }),
        }
      );
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || "Image generation failed");
      invalidate();
      toast({ title: `Generated ${result.images?.length || 0} images for "${blog.title}"` });
    } catch (err) {
      toast({ variant: "destructive", title: "Image generation failed", description: (err as Error).message });
    } finally {
      setGeneratingSlug(null);
    }
  }, [invalidate, toast]);

  return {
    updateStatus,
    updateCategory,
    saveEdit,
    softDelete,
    createPost,
    generateBlogWithAI,
    regenerateImages,
    generatingSlug,
  };
}
