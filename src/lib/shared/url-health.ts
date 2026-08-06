export type UrlHealth = "checking" | "ok" | "broken" | "unknown";

const SUPABASE_STORAGE_PATTERN = /\.supabase\.co\/storage\/v1\/object(?:\/public)?\//;

export function isSupabaseStorageUrl(url: string): boolean {
  return SUPABASE_STORAGE_PATTERN.test(url);
}

export function isBrokenHttpStatus(status: number): boolean {
  return status >= 400 && status < 500 && status !== 405;
}
