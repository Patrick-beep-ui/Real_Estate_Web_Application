import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/shared/require-admin";
import { getProject, vercelHeaders, vercelUrl, VercelConfigError } from "@/lib/vercel/api";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DEFAULT_SECONDS = 25;
const MAX_SECONDS = 55;

/**
 * GET /api/admin/vercel/logs?deploymentId=dpl_...&seconds=25
 *
 * Proxies Vercel's runtime-logs stream (newline-delimited JSON) for up to
 * `seconds`, then closes. The admin page reconnects to keep a live tail.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const deploymentId = request.nextUrl.searchParams.get("deploymentId");
  if (!deploymentId || !/^[\w-]+$/.test(deploymentId)) {
    return NextResponse.json({ error: "Missing or invalid deploymentId" }, { status: 400 });
  }
  const seconds = Math.min(
    MAX_SECONDS,
    Math.max(5, Number(request.nextUrl.searchParams.get("seconds")) || DEFAULT_SECONDS)
  );

  let upstream: Response;
  const controller = new AbortController();
  try {
    const project = await getProject();
    upstream = await fetch(
      vercelUrl(`/v1/projects/${project.id}/deployments/${deploymentId}/runtime-logs`),
      { headers: vercelHeaders(), cache: "no-store", signal: controller.signal }
    );
  } catch (err) {
    const status = err instanceof VercelConfigError ? 503 : 502;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }

  if (!upstream.ok || !upstream.body) {
    const body = await upstream.text().catch(() => "");
    return NextResponse.json(
      { error: `Vercel API ${upstream.status}: ${body || upstream.statusText}` },
      { status: 502 }
    );
  }

  const timer = setTimeout(() => controller.abort(), seconds * 1000);
  request.signal.addEventListener("abort", () => controller.abort());
  const reader = upstream.body.getReader();

  const stream = new ReadableStream<Uint8Array>({
    async start(out) {
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          out.enqueue(value);
        }
      } catch {
        // aborted by timer or client disconnect — normal end of a window
      } finally {
        clearTimeout(timer);
        out.close();
      }
    },
    cancel() {
      clearTimeout(timer);
      controller.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
