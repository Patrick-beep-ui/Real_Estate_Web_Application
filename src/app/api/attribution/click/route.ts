import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

const TAG = "[API:attribution/click]";

const ALLOWED_CHANNELS = new Set(["call", "sms"]);

function getClientIp(request: NextRequest): string {
  try {
    return (
      request.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers?.get?.("x-real-ip") ??
      "unknown"
    );
  } catch {
    return "unknown";
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // Lightweight rate limit — generous, this just needs to stop abuse, not
    // legitimate rapid clicking (e.g. user double-tapping a call button).
    const rl = await rateLimit("attribution/click", ip, { max: 20, windowSeconds: 60 });
    if (!rl.success) {
      console.warn(`${TAG} Rate limit hit`, { ip });
      // Fail silently — a 204 either way. We don't want to reveal rate
      // limiting behavior to whatever is hitting this endpoint.
      return new NextResponse(null, { status: 204 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { channel, target_phone, fbc, fbp, fbclid, gclid, msclkid,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      page_path } = body as Record<string, unknown>;

    if (typeof channel !== "string" || !ALLOWED_CHANNELS.has(channel)) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }

    const userAgent = request.headers.get("user-agent") || null;

    const insertPayload = {
      channel,
      target_phone: typeof target_phone === "string" ? target_phone : null,
      fbc: typeof fbc === "string" ? fbc : null,
      fbp: typeof fbp === "string" ? fbp : null,
      fbclid: typeof fbclid === "string" ? fbclid : null,
      gclid: typeof gclid === "string" ? gclid : null,
      msclkid: typeof msclkid === "string" ? msclkid : null,
      utm_source: typeof utm_source === "string" ? utm_source : null,
      utm_medium: typeof utm_medium === "string" ? utm_medium : null,
      utm_campaign: typeof utm_campaign === "string" ? utm_campaign : null,
      utm_content: typeof utm_content === "string" ? utm_content : null,
      utm_term: typeof utm_term === "string" ? utm_term : null,
      page_path: typeof page_path === "string" ? page_path : null,
      user_agent: userAgent,
      client_ip: ip === "unknown" ? null : ip,
    };

    const { error } = await getSupabaseAdmin().from("attribution_clicks").insert(insertPayload);

    if (error) {
      console.error(`${TAG} Insert failed:`, error.message);
      // Still return 204 to the browser — this is a fire-and-forget beacon,
      // a failure here should never block or alarm the user clicking Call/SMS.
      return new NextResponse(null, { status: 204 });
    }

    console.log(`${TAG} ✔ Click captured`, { channel, hasfbc: !!fbc, hasFbclid: !!fbclid });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error(`${TAG} Unexpected error:`, err);
    return new NextResponse(null, { status: 204 });
  }
}