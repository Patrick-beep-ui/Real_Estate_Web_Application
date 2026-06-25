"use client";

import { supabase } from "@/lib/supabase/client";
import { useCallback } from "react";

export function useBlogImages() {
  const extractStoragePath = useCallback((url: string): string | null => {
    const match = url.match(/\/blog-images\/(.+)$/);
    return match ? match[1] : null;
  }, []);

  const deleteFromStorage = useCallback(async (filePath: string) => {
    const { error } = await supabase.storage.from("blog-images").remove([filePath]);
    if (error) throw error;
  }, []);

  const uploadToStorage = useCallback(async (file: File, slug: string): Promise<string> => {
    const ext = file.name.split(".").pop() || "png";
    const fileName = `uploaded-${Date.now()}.${ext}`;
    const filePath = `${slug}/${fileName}`;
    const { error } = await supabase.storage.from("blog-images").upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("blog-images").getPublicUrl(filePath);
    return data.publicUrl;
  }, []);

  const parseInlineImages = useCallback((content: string): { alt: string; url: string }[] => {
    const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images: { alt: string; url: string }[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      images.push({ alt: match[1], url: match[2] });
    }
    return images;
  }, []);

  const removeImageFromContent = useCallback((content: string, urlToRemove: string): string => {
    const escapedUrl = urlToRemove.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`!\\[[^\\]]*\\]\\(${escapedUrl}\\)\\s*\\n?`, "g");
    return content.replace(regex, "");
  }, []);

  return { extractStoragePath, deleteFromStorage, uploadToStorage, parseInlineImages, removeImageFromContent };
}
