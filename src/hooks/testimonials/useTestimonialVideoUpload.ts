"use client";

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  validateVideoFile,
  storageErrorMessage,
  isDuplicateNameError,
  sanitizeStorageName,
  uniqueStorageName,
} from "@/lib/shared/storage-errors";

const BUCKET = "testimonial-videos";

export function useTestimonialVideoUpload() {
  const [uploading, setUploading] = useState(false);

  const extractStoragePath = useCallback((url: string): string | null => {
    const match = url.match(/\/testimonial-videos\/(.+)$/);
    return match ? match[1] : null;
  }, []);

  const deleteVideo = useCallback(async (url: string) => {
    const filePath = extractStoragePath(url);
    if (!filePath) throw new Error("Could not extract storage path from URL");
    const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
    if (error) throw new Error(storageErrorMessage(error));
  }, [extractStoragePath]);

  const uploadVideo = useCallback(async (file: File, fileName?: string): Promise<string> => {
    const validationError = validateVideoFile(file);
    if (validationError) throw new Error(validationError);

    const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
    const base = sanitizeStorageName(fileName?.trim() ?? "") || `video-${Date.now()}`;
    const name = `${base}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(name, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      if (isDuplicateNameError(error)) {
        const retryName = uniqueStorageName(base, ext);
        const { error: retryError } = await supabase.storage
          .from(BUCKET)
          .upload(retryName, file, { cacheControl: "3600", upsert: false });
        if (retryError) throw new Error(storageErrorMessage(retryError));
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(retryName);
        return data.publicUrl;
      }
      throw new Error(storageErrorMessage(error));
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(name);
    return data.publicUrl;
  }, []);

  const uploadAndSet = useCallback(async (file: File, fileName?: string): Promise<string> => {
    setUploading(true);
    try {
      return await uploadVideo(file, fileName);
    } finally {
      setUploading(false);
    }
  }, [uploadVideo]);

  return { uploadVideo: uploadAndSet, deleteVideo, extractStoragePath, uploading };
}
