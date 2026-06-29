"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { BlogPost } from "@/types/blog";
import { useBlogImages } from "@/hooks/useBlogImages";

type EditForm = Partial<BlogPost> & { content: string };

interface UseBlogEditorOptions {
  saveEdit: UseMutationResult<void, Error, { id: string; form: Record<string, unknown> }, unknown>;
  createPost: UseMutationResult<void, Error, Record<string, unknown>, unknown>;
  generateBlogWithAI: UseMutationResult<BlogPost, Error, { title: string; category?: string }, unknown>;
}

export function useBlogEditor({ saveEdit, createPost, generateBlogWithAI }: UseBlogEditorOptions) {
  const [editPost, setEditPost] = useState<BlogPost | null>(null);
  const [creating, setCreating] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({ content: "" });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [cursorPos, setCursorPos] = useState<number | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [replacingImageUrl, setReplacingImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const {
    uploadToStorage, parseInlineImages, extractStoragePath,
    deleteFromStorage, removeImageFromContent,
  } = useBlogImages();

  const isEmpty = !editForm.title || !editForm.slug;
  const isPending = saveEdit.isPending || createPost.isPending || generateBlogWithAI.isPending;

  const insertAtCursor = useCallback((text: string) => {
    setEditForm((f) => {
      const content = f.content || "";
      const pos = cursorPos ?? content.length;
      return { ...f, content: content.slice(0, pos) + text + content.slice(pos) };
    });
  }, [cursorPos]);

  const replaceImageUrl = useCallback((oldUrl: string, newUrl: string, alt: string) => {
    setEditForm((f) => {
      const escapedOld = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`!\\[[^\\]]*\\]\\(${escapedOld}\\)`);
      return { ...f, content: (f.content || "").replace(regex, `![${alt}](${newUrl})`) };
    });
  }, []);

  const openCreate = useCallback(() => {
    setCreating(true);
    setEditPost(null);
    setNewImageUrl("");
    setSlugManuallyEdited(false);
    setEditForm({
      title: "", slug: "", content: "", excerpt: "",
      meta_description: "", seo_title: "", category: "",
      schema_type: "Article", featured_image_url: "",
    });
  }, []);

  const openEdit = useCallback((post: BlogPost) => {
    setCreating(false);
    setEditPost(post);
    setNewImageUrl("");
    setSlugManuallyEdited(false);
    setEditForm({
      title: post.title,
      slug: post.slug,
      content: post.content || "",
      excerpt: post.excerpt || "",
      meta_description: post.meta_description || "",
      seo_title: post.seo_title || "",
      category: post.category || "",
      schema_type: post.schema_type || "Article",
      featured_image_url: post.featured_image_url || "",
    });
  }, []);

  const close = useCallback(() => {
    setEditPost(null);
    setCreating(false);
  }, []);

  const handleSave = useCallback(() => {
    if (creating) {
      createPost.mutate(editForm as unknown as Record<string, unknown>, { onSuccess: () => close() });
    } else if (editPost) {
      saveEdit.mutate({ id: editPost.id, form: editForm as unknown as Record<string, unknown> }, { onSuccess: () => close() });
    }
  }, [creating, editPost, editForm, createPost, saveEdit, close]);

  useEffect(() => {
    if (!creating || slugManuallyEdited) return;
    const slug = (editForm.title || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setEditForm((f) => ({ ...f, slug }));
  }, [editForm.title, creating, slugManuallyEdited]);

  return {
    editPost,
    creating,
    editForm,
    setEditForm,
    slugManuallyEdited,
    setSlugManuallyEdited,
    cursorPos,
    setCursorPos,
    contentRef,
    newImageUrl,
    setNewImageUrl,
    replacingImageUrl,
    setReplacingImageUrl,
    uploadingImage,
    setUploadingImage,
    isEmpty,
    isPending,
    uploadToStorage,
    parseInlineImages,
    extractStoragePath,
    deleteFromStorage,
    removeImageFromContent,
    insertAtCursor,
    replaceImageUrl,
    openCreate,
    openEdit,
    close,
    handleSave,
    generateBlogWithAI,
  };
}
