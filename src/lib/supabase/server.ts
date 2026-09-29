/**
 * SERVER-ONLY Supabase client using the service role key.
 *
 * DO NOT import this from any file that runs in the browser.
 * Only use in API routes, server components, and other server-side code.
 * The service role key bypasses ALL Row Level Security policies —
 * leaking it into a client bundle would compromise every table.
 *
 * For client-side code (Client Components, browser scripts), use the anon
 * client from `@/lib/supabase/client` instead.
 */
import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/shared/env";

let _supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Throws a clear, actionable error when the key is missing. Previously this
 * warned and then called createClient with an empty key, which threw an opaque
 * "supabaseKey is required" from inside the Supabase constructor and surfaced
 * at the call site as a database failure.
 */
export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        "[supabase:server] SUPABASE_SERVICE_ROLE_KEY is not configured. " +
          "Set SUPABASE_SERVICE_ROLE_KEY (or TESTING_SUPABASE_SERVICE_ROLE_KEY) in the deployment environment."
      );
    }
    _supabaseAdmin = createClient<Database>(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }
  return _supabaseAdmin;
}

/**
 * Non-throwing variant for best-effort/observability code paths. Returns null
 * when the service client is unavailable so callers can degrade gracefully
 * instead of failing the request they are only observing.
 */
export function tryGetSupabaseAdmin() {
  try {
    return getSupabaseAdmin();
  } catch (error) {
    console.warn(
      "[supabase:server] service-role client unavailable",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}