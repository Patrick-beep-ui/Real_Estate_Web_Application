"use client";

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase/client";

const BUCKET = "testimonial-thumbnails";

export function useTestimonialThumbnailUpload() {
  const [uploading, setUploading] = useState(false);

  const extractStoragePath = useCallback((url: string): string | null => {
    const match = url.match(/\/testimonial-thumbnails\/(.+)$/);
    return match ? match[1] : null;
  }, []);

  const deleteThumbnail = useCallback(async (url: string) => {
    const filePath = extractStoragePath(url);
    if (!filePath) throw new Error("Could not extract storage path from URL");
    const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
    if (error) throw error;
  }, [extractStoragePath]);

  const uploadThumbnail = useCallback(async (file: File, fileName?: string): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const name = fileName ? `${fileName}.${ext}` : `thumbnail-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(name, file, {
      cacheControl: "3600",
      upsert: true,
    });
    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(name);
    return data.publicUrl;
  }, []);

  const uploadAndSet = useCallback(async (file: File, fileName?: string): Promise<string> => {
    setUploading(true);
    try {
      return await uploadThumbnail(file, fileName);
    } finally {
      setUploading(false);
    }
  }, [uploadThumbnail]);

  return { uploadThumbnail: uploadAndSet, deleteThumbnail, extractStoragePath, uploading };
}
