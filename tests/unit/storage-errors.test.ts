/// <reference types="jest" />

import {
  MAX_VIDEO_BYTES,
  MAX_THUMBNAIL_BYTES,
  storageErrorMessage,
  isDuplicateNameError,
  validateVideoFile,
  validateThumbnailFile,
  sanitizeStorageName,
  uniqueStorageName,
  type FileLike,
} from "@/lib/shared/storage-errors";

describe("storage-errors", () => {
  describe("storageErrorMessage()", () => {
    it("maps RLS / permission errors to a friendly message", () => {
      const err = { message: "new row violates row-level security policy for table \"storage.objects\"", statusCode: 403 };
      expect(storageErrorMessage(err)).toBe(
        "You don't have permission to upload files here. Make sure you're signed in as an admin."
      );
    });

    it("maps 413 / too-large errors", () => {
      expect(storageErrorMessage({ message: "Payload too large", statusCode: 413 })).toBe("File is too large.");
      expect(storageErrorMessage("File exceeds the maximum allowed size")).toBe("File is too large.");
    });

    it("maps duplicate-name errors", () => {
      expect(storageErrorMessage("The resource already exists")).toBe("A file with this name already exists.");
      expect(storageErrorMessage({ message: "Duplicate", statusCode: 400 })).toBe(
        "A file with this name already exists."
      );
    });

    it("maps missing-bucket errors", () => {
      expect(storageErrorMessage("Bucket not found")).toBe("Storage bucket is missing or misconfigured.");
    });

    it("maps network / TypeError errors", () => {
      expect(storageErrorMessage(new TypeError("Failed to fetch"))).toBe(
        "Network error. Check your connection and try again."
      );
      expect(storageErrorMessage("network request failed")).toBe(
        "Network error. Check your connection and try again."
      );
    });

    it("falls back to the raw message, then to the fallback string", () => {
      expect(storageErrorMessage("Some random storage message")).toBe("Some random storage message");
      expect(storageErrorMessage("Some random storage message", "fallback")).toBe("Some random storage message");
      expect(storageErrorMessage(undefined, "Upload failed. Please try again.")).toBe(
        "Upload failed. Please try again."
      );
      expect(storageErrorMessage(null)).toBe("Upload failed. Please try again.");
    });
  });

  describe("isDuplicateNameError()", () => {
    it("detects duplicate-name errors", () => {
      expect(isDuplicateNameError("The resource already exists")).toBe(true);
      expect(isDuplicateNameError({ message: "Duplicate", statusCode: 400 })).toBe(true);
    });

    it("returns false for other errors", () => {
      expect(isDuplicateNameError("Bucket not found")).toBe(false);
      expect(isDuplicateNameError(undefined)).toBe(false);
    });
  });

  describe("validateVideoFile()", () => {
    it("accepts valid video files by MIME type", () => {
      const file: FileLike = { name: "clip.mp4", type: "video/mp4", size: 1024 };
      expect(validateVideoFile(file)).toBeNull();
    });

    it("accepts valid video files by extension when MIME is empty", () => {
      const file: FileLike = { name: "clip.webm", type: "", size: 1024 };
      expect(validateVideoFile(file)).toBeNull();
    });

    it("rejects unsupported formats", () => {
      const file: FileLike = { name: "clip.txt", type: "text/plain", size: 1024 };
      expect(validateVideoFile(file)).toBe("Unsupported video format. Use MP4, WebM, or MOV.");
    });

    it("rejects files over the size limit", () => {
      const file: FileLike = { name: "clip.mp4", type: "video/mp4", size: MAX_VIDEO_BYTES + 1 };
      expect(validateVideoFile(file)).toBe("Video is too large. Max 500MB.");
    });
  });

  describe("validateThumbnailFile()", () => {
    it("accepts valid images by MIME type", () => {
      const file: FileLike = { name: "thumb.png", type: "image/png", size: 1024 };
      expect(validateThumbnailFile(file)).toBeNull();
    });

    it("accepts valid images by extension when MIME is empty", () => {
      const file: FileLike = { name: "thumb.jpg", type: "", size: 1024 };
      expect(validateThumbnailFile(file)).toBeNull();
    });

    it("rejects unsupported formats", () => {
      const file: FileLike = { name: "thumb.gif", type: "image/gif", size: 1024 };
      expect(validateThumbnailFile(file)).toBe("Unsupported image format. Use PNG, JPG, or WebP.");
    });

    it("rejects files over the size limit", () => {
      const file: FileLike = { name: "thumb.png", type: "image/png", size: MAX_THUMBNAIL_BYTES + 1 };
      expect(validateThumbnailFile(file)).toBe("Image is too large. Max 5MB.");
    });
  });

  describe("sanitizeStorageName()", () => {
    it("collapses whitespace into dashes", () => {
      expect(sanitizeStorageName("Alice Blackwelder")).toBe("Alice-Blackwelder");
      expect(sanitizeStorageName("  john   doe  ")).toBe("john-doe");
    });

    it("strips characters unsafe for storage paths", () => {
      expect(sanitizeStorageName("alice!/test")).toBe("alicetest");
    });

    it("trims leading/trailing separators", () => {
      expect(sanitizeStorageName("--alice--")).toBe("alice");
    });

    it("keeps periods, dashes, and underscores", () => {
      expect(sanitizeStorageName("john_doe-v2.0")).toBe("john_doe-v2.0");
    });
  });

  describe("uniqueStorageName()", () => {
    it("appends a timestamp before the extension", () => {
      expect(uniqueStorageName("alice", "mp4", 1234567890)).toBe("alice-1234567890.mp4");
    });
  });
});
