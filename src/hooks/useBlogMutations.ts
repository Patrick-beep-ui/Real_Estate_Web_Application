"use client";

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { SUPABASE_URL } from "@/lib/env";
import { useToast } from "@/hooks/use-toast";
import type { BlogPost } from "@/types/blog";

export function useBlogMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [generatingSlug, setGeneratingSlug] = useState<string | null>(null);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
  }, [queryClient]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("blog_posts")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      if (status === "published") {
        const { error: pubError } = await supabase
          .from("blog_posts")
          .update({ published_at: new Date().toISOString() })
          .eq("id", id)
          .is("published_at", null);
        if (pubError) throw pubError;
      }
    },
    onSuccess: () => { invalidate(); toast({ title: "Status updated" }); },
    onError: (err) => { toast({ variant: "destructive", title: "Error", description: (err as Error).message }); },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, category }: { id: string; category: string }) => {
      const { error } = await supabase
        .from("blog_posts")
        .update({ category, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: "Category updated" }); },
    onError: (err) => { toast({ variant: "destructive", title: "Error", description: (err as Error).message }); },
  });

  const saveEdit = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("blog_posts")
        .update({
          title: form.title as string | undefined,
          slug: form.slug as string | undefined,
          content: form.content as string | undefined,
          excerpt: form.excerpt as string | undefined,
          meta_description: form.meta_description as string | undefined,
          seo_title: form.seo_title as string | undefined,
          category: form.category as string | undefined,
          schema_type: form.schema_type as string | undefined,
          featured_image_url: (form.featured_image_url as string | undefined) || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onError: (err) => { toast({ variant: "destructive", title: "Error", description: (err as Error).message }); },
  });

  const softDelete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("blog_posts")
        .update({ status: "archived", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: "Blog archived" }); },
    onError: (err) => { toast({ variant: "destructive", title: "Error", description: (err as Error).message }); },
  });

  const createPost = useMutation({
    mutationFn: async (form: Record<string, unknown>) => {
      const { error } = await supabase
        .from("blog_posts")
        .insert({
          title: (form.title as string) || "",
          slug: (form.slug as string) || "",
          content: form.content as string | undefined,
          excerpt: (form.excerpt as string) || null,
          meta_description: (form.meta_description as string) || null,
          seo_title: (form.seo_title as string) || null,
          category: (form.category as string) || null,
          schema_type: (form.schema_type as string) || "Article",
          featured_image_url: (form.featured_image_url as string) || null,
          status: "draft",
          ai_generated: false,
        })
        .select()
        .single();
      if (error) throw error;
    },
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
