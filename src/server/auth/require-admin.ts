import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ApiError } from "@/server/http/errors";
import { prisma } from "@/server/db/prisma";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/shared/env";
import { AppRole } from "@/generated/prisma/client";

export type AdminContext = { userId: string; email?: string };

export async function requireAdmin(request: NextRequest): Promise<AdminContext> {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token) throw ApiError.unauthorized("Missing bearer token");

  const supabaseAsCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await supabaseAsCaller.auth.getUser(token);
  if (userError || !userData?.user) throw ApiError.unauthorized("Invalid or expired session");

  const roleRow = await prisma.userRole.findFirst({
    where: { userId: userData.user.id, role: AppRole.admin },
    select: { role: true },
  });
  if (!roleRow) throw ApiError.forbidden("Admin access required");

  return { userId: userData.user.id, email: userData.user.email };
}