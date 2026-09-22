import { mergeLiveAndSession } from "@/lib/tracking/traffic-source";

const TAG = "[TBH:attribution-beacon]";

function getCookie(name: string): string | null {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Fire-and-forget attribution beacon for call/SMS CTAs. Writes the click IDs
 * and UTMs (live + active tab session) that apply to that click into the
 * `attribution_clicks` table via the server endpoint. Never throws, so a
 * tracking failure can never block or interrupt a phone link.
 */
export function sendAttributionBeacon(channel: "call" | "sms", targetPhone?: string): void {
  try {
    const { utms, clickIds } = mergeLiveAndSession();
    const payload = {
      channel,
      target_phone: targetPhone || null,
      page_path: window.location.pathname,
      fbc: getCookie("_fbc"),
      fbp: getCookie("_fbp"),
      ...clickIds,
      ...utms,
    };

    fetch("/api/attribution/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch((err) => {
      console.debug(`${TAG} beacon failed (silent):`, err instanceof Error ? err.message : err);
    });
  } catch (err) {
    console.debug(`${TAG} beacon skipped (silent):`, err instanceof Error ? err.message : err);
  }
}