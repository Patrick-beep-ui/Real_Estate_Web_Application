import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/shared/env";

/**
 * Verifies that a Route Handler request comes from a signed-in admin.
 *
 * The browser Supabase session lives in localStorage (not cookies), so the
 * client must forward its access token as `Authorization: Bearer <token>`.
 * Same logic as the check in /api/places/test.
 */
export type AdminCheck =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

export async function requireAdmin(request: Request): Promise<AdminCheck> {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!token) return { ok: false, status: 401, error: "Missing bearer token" };

  const supabaseAsCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabaseAsCaller.auth.getUser(token);
  if (userError || !userData?.user) {
    return { ok: false, status: 401, error: "Invalid or expired session" };
  }

  const { data: roleRow, error: roleError } = await getSupabaseAdmin()
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError) {
    return { ok: false, status: 500, error: `Role lookup failed: ${roleError.message}` };
  }
  if (!roleRow) return { ok: false, status: 403, error: "Admin access required" };

  return { ok: true, userId: userData.user.id };
}
