import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateAddressShape } from "@/lib/shared/address";
import { buildAddressBlockMessage, geocodeAddress } from "@/lib/leads/geocode";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/shared/env";
import { rateLimit } from "@/lib/shared/rate-limit";
import { getClientIp } from "@/lib/shared/requests";

/**
 * Admin-only "dry run" address tester.
 *
 * Runs a submitted address through the EXACT SAME validation pipeline as
 * /api/leads/submit (validateAddressShape -> geocodeAddress ->
 * buildAddressBlockMessage) so results here always match what a real
 * visitor would experience. Nothing else from the submit flow runs: no
 * Supabase lead insert, no GHL sync, no Slack notification, no Meta CAPI
 * event. This route exists purely to let admins test addresses without
 * creating a lead.
 *
 * Auth: the browser Supabase session lives in localStorage, not cookies, so
 * there is no session available to a server Route Handler automatically.
 * The client must forward the access token explicitly as
 * `Authorization: Bearer <access_token>` (see supabase.auth.getSession()).
 *
 * We verify that token the same way the REST of the app trusts a session —
 * via useAdminAuth() and the anon-keyed browser client — rather than
 * validating it against the service-role admin client. A service-role
 * client's auth.getUser(jwt) is not meant for authenticating someone else's
 * token and behaves unreliably for it; the anon key + the caller's own JWT
 * is the same pairing useAdminAuth relies on client-side. Only the
 * follow-up user_roles lookup uses the service-role client, to bypass RLS.
 */

const TAG = "[API:places/test]";

type AdminCheck = { ok: true } | { ok: false; status: number; error: string };

async function requireAdmin(request: NextRequest): Promise<AdminCheck> {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!token) {
    return { ok: false, status: 401, error: "Missing bearer token" };
  }
  
  console.debug(`${TAG} Verifying token: ${token.slice(0, 8)}...`);

  const supabaseAsCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabaseAsCaller.auth.getUser(token);
  if (userError || !userData?.user) {
    console.error(`${TAG} token verification failed:`, userError?.message || "no user in response");
    return { ok: false, status: 401, error: "Invalid or expired session" };
  }

  console.log(`${TAG} token verified for user ${userData.user.id} (${userData.user.email})`);

  const supabaseAdmin = getSupabaseAdmin();
  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();


  if (roleError) {
    console.error(
      `${TAG} user_roles lookup ERRORED for ${userData.user.id}:`,
      roleError.message,
      roleError.code,
      roleError.details
    );
    return {
      ok: false,
      status: 500,
      error: `Role lookup failed (${roleError.code || "no code"}): ${roleError.message}`,
    };
  }

  if (!roleRow) {
    console.warn(`${TAG} user ${userData.user.id} authenticated but has no admin row in user_roles`);
    return { ok: false, status: 403, error: "Admin access required" };
  }

  return { ok: true };
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // Separate, tighter bucket from the public leads/places endpoints — this
    // is an authenticated admin tool, not a public-facing one, but it still
    // triggers paid Google API calls so it gets its own rate limit.
    const rl = await rateLimit("places/test", ip, { max: 30, windowSeconds: 60 });
    if (!rl.success) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const auth = await requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let body: { address?: unknown; address_source?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const address = typeof body.address === "string" ? body.address.trim() : "";
    const addressSourceInput =
      typeof body.address_source === "string" ? body.address_source : null;

    if (!address) {
      return NextResponse.json(
        { error: "invalid_request", details: "address is required" },
        { status: 400 }
      );
    }

    const selectedFromGoogle =
      addressSourceInput === "google_selected" || addressSourceInput === "server_places_selected";

    // --- Mirrors the address enforcement block in /api/leads/submit ---
    if (!validateAddressShape(address)) {
      const block = buildAddressBlockMessage(address, "no_match", selectedFromGoogle);
      return NextResponse.json({
        valid: false,
        address_verified: false,
        stage: "shape",
        error_code: "no_match",
        error: block.error,
        message: block.message,
        address,
      });
    }

    const geo = await geocodeAddress(address);

    if (geo.ok) {
      return NextResponse.json({
        valid: true,
        address_verified: true,
        stage: "geocode",
        address_source: addressSourceInput || "server_geocoded",
        address,
      });
    }

    const block = buildAddressBlockMessage(address, geo.error || "unknown", selectedFromGoogle);
    return NextResponse.json({
      valid: false,
      address_verified: false,
      stage: "geocode",
      error_code: geo.error || "unknown",
      error: block.error,
      message: block.message,
      address,
    });
  } catch (error) {
    console.error(`${TAG} Unexpected error:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
