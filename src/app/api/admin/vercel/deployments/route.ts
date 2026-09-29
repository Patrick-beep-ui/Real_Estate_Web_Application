import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/shared/require-admin";
import { listDeployments, VercelApiError, VercelConfigError } from "@/lib/vercel/api";

export const dynamic = "force-dynamic";

/** GET /api/admin/vercel/deployments?target=production|preview */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const target = request.nextUrl.searchParams.get("target") || undefined;
  try {
    const result = await listDeployments({ target, limit: 20 });
    return NextResponse.json(result);
  } catch (err) {
    const status = err instanceof VercelConfigError ? 503 : err instanceof VercelApiError ? 502 : 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
