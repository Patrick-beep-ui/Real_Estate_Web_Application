/**
 * Meta Conversions API — server-side Lead event.
 *
 * Fires the same Lead event the browser pixel fires, sharing the browser's
 * event_id so Meta deduplicates the pair. Recovers signal from iOS opt-out
 * and ad-blocked traffic where the pixel never loads.
 *
 * Env: META_CAPI_ACCESS_TOKEN (Events Manager > pixel > Settings >
 * Conversions API > Generate access token) + NEXT_PUBLIC_META_PIXEL_ID.
 * Optional META_CAPI_TEST_EVENT_CODE routes events to the Test Events tab.
 */

import { createHash } from "crypto";
import type { LeadData } from "./types";

const TAG = "[TBH:meta-capi]";
const GRAPH_API_VERSION = "v23.0";

export interface MetaCapiContext {
  eventId: string;
  fbp?: string | null;
  fbc?: string | null;
  clientIp?: string;
  userAgent?: string;
  sourceUrl?: string;
}

const sha256 = (v: string) =>
  createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

const hashIfPresent = (v?: string | null): string[] | undefined =>
  v && v.trim() ? [sha256(v)] : undefined;

export async function sendMetaLeadEvent(
  lead: LeadData,
  ctx: MetaCapiContext
): Promise<{ success: boolean; error?: string }> {
  const accessToken =
    process.env.TESTING_META_CAPI_ACCESS_TOKEN || process.env.META_CAPI_ACCESS_TOKEN;
  const pixelId =
    process.env.NEXT_PUBLIC_TESTING_META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID;

  if (!accessToken || !pixelId) {
    console.warn(`${TAG} skipped — CAPI token or pixel ID not configured`);
    return { success: false, error: "not configured" };
  }

  const [firstName, ...rest] = (lead.name || "").trim().split(/\s+/);

  // JSON.stringify drops undefined values, so absent fields never reach Meta.
  const userData = {
    em: hashIfPresent(lead.email),
    ph: hashIfPresent(lead.phone?.replace(/\D/g, "")),
    fn: hashIfPresent(firstName),
    ln: hashIfPresent(rest.length ? rest.join(" ") : undefined),
    // Cookies, IP, and UA are matching keys Meta expects unhashed.
    fbp: ctx.fbp || undefined,
    fbc: ctx.fbc || (lead.fbclid ? `fb.1.${Date.now()}.${lead.fbclid}` : undefined),
    client_ip_address: ctx.clientIp || undefined,
    client_user_agent: ctx.userAgent || undefined,
  };

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: ctx.eventId,
        action_source: "website",
        event_source_url: ctx.sourceUrl,
        user_data: userData,
      },
    ],
  };
  if (process.env.META_CAPI_TEST_EVENT_CODE) {
    payload.test_event_code = process.env.META_CAPI_TEST_EVENT_CODE;
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const result = await res.json().catch(() => ({}));

    if (res.ok && result.events_received) {
      console.log(`${TAG} ✔ Lead sent (event_id: ${ctx.eventId})`);
      return { success: true };
    }
    const error = result?.error?.message || JSON.stringify(result);
    console.error(`${TAG} ✘ Meta rejected Lead event: ${error}`);
    return { success: false, error };
  } catch (err) {
    const error = err instanceof Error ? err.message : "network error";
    console.error(`${TAG} ✘ Lead event network failure: ${error}`);
    return { success: false, error };
  }
}
