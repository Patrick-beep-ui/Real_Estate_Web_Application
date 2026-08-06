export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;

const VIDEO_EXTENSIONS = ["mp4", "webm", "mov"] as const;
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp"] as const;

const VIDEO_MIME = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const IMAGE_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

export type FileLike = { name: string; type: string; size: number };

function errorMessage(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null && "message" in err) {
    const message = (err as { message: unknown }).message;
    if (typeof message === "string") return message;
  }
  return String(err);
}

function errorStatus(err: unknown): number | undefined {
  if (err && typeof err === "object" && "statusCode" in err) {
    const status = (err as { statusCode?: unknown }).statusCode;
    if (typeof status === "number") return status;
  }
  return undefined;
}

export function storageErrorMessage(err: unknown, fallback = "Upload failed. Please try again."): string {
  const message = errorMessage(err).toLowerCase();
  const status = errorStatus(err);

  if (
    status === 403 ||
    message.includes("row-level security") ||
    message.includes("permission denied") ||
    message.includes("not authorized")
  ) {
    return "You don't have permission to upload files here. Make sure you're signed in as an admin.";
  }
  if (status === 413 || message.includes("payload too large") || message.includes("too large") || message.includes("exceeds the maximum")) {
    return "File is too large.";
  }
  if (message.includes("already exists") || message.includes("duplicate")) {
    return "A file with this name already exists.";
  }
  if (message.includes("bucket") && message.includes("not found")) {
    return "Storage bucket is missing or misconfigured.";
  }
  if (err instanceof TypeError || message.includes("network") || message.includes("fetch failed")) {
    return "Network error. Check your connection and try again.";
  }
  return errorMessage(err) || fallback;
}

export function isDuplicateNameError(err: unknown): boolean {
  const message = errorMessage(err).toLowerCase();
  return message.includes("already exists") || message.includes("duplicate");
}

function hasExtension(fileName: string, extensions: readonly string[]): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return (extensions as readonly string[]).includes(ext);
}

export function validateVideoFile(file: FileLike): string | null {
  if (!VIDEO_MIME.has(file.type) && !hasExtension(file.name, VIDEO_EXTENSIONS)) {
    return "Unsupported video format. Use MP4, WebM, or MOV.";
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return "Video is too large. Max 100MB.";
  }
  return null;
}

export function validateThumbnailFile(file: FileLike): string | null {
  if (!IMAGE_MIME.has(file.type) && !hasExtension(file.name, IMAGE_EXTENSIONS)) {
    return "Unsupported image format. Use PNG, JPG, or WebP.";
  }
  if (file.size > MAX_THUMBNAIL_BYTES) {
    return "Image is too large. Max 5MB.";
  }
  return null;
}

export function sanitizeStorageName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^[._-]+|[._-]+$/g, "");
}

export function uniqueStorageName(base: string, ext: string, timestamp = Date.now()): string {
  return `${base}-${timestamp}.${ext}`;
}
