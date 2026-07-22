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
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/env";

let _supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.warn(
        "[supabase:server] SUPABASE_SERVICE_ROLE_KEY not configured — server-side supabase writes will fail RLS"
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