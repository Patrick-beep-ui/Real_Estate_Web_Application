import { Tag } from "lucide-react";

const TAG = "[TBH:traffic-source]";


const ATTRIBUTION_STORAGE_KEY = "tbh_attribution";
const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface StoredAttribution {
  utms: ReturnType<typeof getUtmParams>;
  clickIds: ReturnType<typeof getClickIds>;
  capturedAt: number;
  pagePath: string;
}

export function getTrafficSourceLabel(data: {
  utm_source?: string | null;
  gclid?: string | null;
  gbraid?: string | null;
  wbraid?: string | null;
  fbclid?: string | null;
  msclkid?: string | null;
  utm_id?: string | null;
  fb_adset_id?: string | null;
  fb_campaign_id?: string | null;
}): string {
  if (data.gclid || data.gbraid || data.wbraid || data.utm_source === "adwords") return "Google Ads";
  if (data.fbclid || data.fb_adset_id || data.fb_campaign_id || data.utm_source === "facebook" || data.utm_source === "meta")
    return "Meta Ads";
  if (data.msclkid) return "Microsoft Ads";
  return "Direct / Organic";
}

/** Extract UTM params from current URL */
export function getUtmParams() {
  try {
    const params = new URLSearchParams(window.location.search);
    const utms = {
      utm_source: params.get("utm_source") || null,
      utm_medium: params.get("utm_medium") || null,
      utm_campaign: params.get("utm_campaign") || null,
      utm_content: params.get("utm_content") || null,
      utm_term: params.get("utm_term") || null,
      utm_id: params.get("utm_id") || null,
    };
    console.log(`${TAG} UTM extraction:`, {
      utm_source: utms.utm_source || "(none)",
      utm_medium: utms.utm_medium || "(none)",
      utm_campaign: utms.utm_campaign || "(none)",
      utm_content: utms.utm_content || "(none)",
      utm_term: utms.utm_term || "(none)",
      utm_id: utms.utm_id || "(none)",
      raw_search: window.location.search || "(empty)",
    });
    return utms;
  } catch {
    console.warn(`${TAG} UTM extraction failed`);
    return { utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null, utm_term: null, utm_id: null };
  }
}

function getCookie(name: string): string | null {
  try {
    const cookie = document.cookie
      .split("; ")
      .find((value) => value.startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
  } catch {
    return null;
  }
}

function getConversionLinkerClickId(cookieName: string): string | null {
  const cookieValue = getCookie(cookieName);

  if (!cookieValue) return null;

  // Conversion Linker values use GCL.<timestamp>.<click-id>. Keep everything
  // after the timestamp so opaque IDs containing periods remain intact.
  const entry = cookieValue
    .split("$")
    .filter((value) => value.startsWith("GCL."))
    .at(-1);

  if (!entry) return null;

  return entry.split(".").slice(2).join(".") || null;
}

/** Extract ad platform click IDs from the URL with Conversion Linker fallback. */
export function getClickIds() {
  try {
    const params = new URLSearchParams(window.location.search);
    const gclid = params.get("gclid");
    const gbraid = params.get("gbraid");
    const wbraid = params.get("wbraid");
    const hasExplicitGoogleClickId = Boolean(gclid || gbraid || wbraid);
    const utmSource = params.get("utm_source")?.toLowerCase();
    const hasGoogleUtmSource = utmSource === "google" || utmSource === "adwords";
    const canUseGoogleCookieFallback = !hasExplicitGoogleClickId && hasGoogleUtmSource;
    const clickIds = {
      gclid: gclid || (canUseGoogleCookieFallback ? getConversionLinkerClickId("_gcl_aw") : null),
      gbraid: gbraid || (canUseGoogleCookieFallback ? getConversionLinkerClickId("_gcl_gb") : null),
      wbraid: wbraid || null,
      fbclid: params.get("fbclid") || null,
      fb_adset_id: params.get("fb_adset_id") || null,
      fb_campaign_id: params.get("fb_campaign_id") || null,
      msclkid: params.get("msclkid") || null,
    };
    console.log(`${TAG} Click ID extraction:`, {
      gclid: clickIds.gclid ? "present" : "(none)",
      gbraid: clickIds.gbraid ? "present" : "(none)",
      wbraid: clickIds.wbraid ? "present" : "(none)",
      fbclid: clickIds.fbclid ? "present" : "(none)",
      fb_adset_id: clickIds.fb_adset_id ? "present" : "(none)",
      fb_campaign_id: clickIds.fb_campaign_id ? "present" : "(none)",
      msclkid: clickIds.msclkid ? "present" : "(none)",
    });
    return clickIds;
  } catch {
    console.warn(`${TAG} Click ID extraction failed`);
    return { gclid: null, gbraid: null, wbraid: null, fbclid: null, fb_adset_id: null, fb_campaign_id: null, msclkid: null };
  }
}

// ── First-touch attribution persistence ────────────────────────────────────
//First-touch capture stores that snapshot so a later submissio (or call/SMS CTA) from a different route keeps the original attribution.

function safeStorageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch(e) {
    console.log(`${TAG} Error capturing ${ATTRIBUTION_STORAGE_KEY} local storage`)
  }
}

function readStoredAttribution(): StoredAttribution | null {
  const raw = safeStorageGet(ATTRIBUTION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredAttribution>;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.capturedAt !== "number" || !parsed.utms || !parsed.clickIds) return null;
    if (Date.now() - parsed.capturedAt > ATTRIBUTION_TTL_MS) return null;
    return parsed as StoredAttribution;
  } catch {
    return null;
  }
}

function liveHasExplicitAttribution(params: URLSearchParams): boolean {
  const explicit = [
    params.get("gclid"),
    params.get("gbraid"),
    params.get("wbraid"),
    params.get("fbclid"),
    params.get("msclkid"),
    params.get("utm_id"),
    params.get("fb_adset_id"),
    params.get("fb_campaign_id"),
  ];
  return explicit.some(Boolean);
}

/**
 * Persist the current URL's attribution as first-touch. A snapshot is written
 * when none exists, or when the current URL carries a fresh explicit ad click
 * ID (a new ad click supersedes the old one). Organic visits never overwrite.
 */
export function captureAttributionNow(): StoredAttribution | null {
  try {
    const utms = getUtmParams();
    const clickIds = getClickIds();
    const params = new URLSearchParams(window.location.search);
    const existing = readStoredAttribution();

    if (existing && !liveHasExplicitAttribution(params)) {
      return existing;
    }

    const snapshot: StoredAttribution = {
      utms,
      clickIds,
      capturedAt: Date.now(),
      pagePath: window.location.pathname,
    };
    safeStorageSet(ATTRIBUTION_STORAGE_KEY, JSON.stringify(snapshot));
    console.log(`${TAG} Attribution captured at ${snapshot.pagePath}`, {
      utm_source: utms.utm_source || "(none)",
      fbclid: clickIds.fbclid ? "present" : "(none)",
      gclid: clickIds.gclid ? "present" : "(none)",
    });
    return snapshot;
  } catch (err) {
    console.warn(`${TAG} Attribution capture failed:`, err);
    return null;
  }
}

/** The persisted first-touch snapshot, or null when absent or expired. */
export function getStoredAttribution(): StoredAttribution | null {
  return readStoredAttribution();
}

/**
 * Merge live URL attribution with the first-touch snapshot. Live values win;
 * stored values fill in whatever the current URL no longer carries, so a
 * submission from page 2 of a session still attributes to the original ad.
 */
export function mergeLiveAndStored(): {
  utms: ReturnType<typeof getUtmParams>;
  clickIds: ReturnType<typeof getClickIds>;
} {
  const liveUtms = getUtmParams();
  const liveClickIds = getClickIds();
  const stored = readStoredAttribution();

  if (!stored) return { utms: liveUtms, clickIds: liveClickIds };

  const utms = Object.fromEntries(
    Object.entries(stored.utms).map(([key, value]) => [
      key,
      liveUtms[key as keyof ReturnType<typeof getUtmParams>] || value,
    ])
  ) as ReturnType<typeof getUtmParams>;

  const clickIds = Object.fromEntries(
    Object.entries(stored.clickIds).map(([key, value]) => [
      key,
      liveClickIds[key as keyof ReturnType<typeof getClickIds>] || value,
    ])
  ) as ReturnType<typeof getClickIds>;

  return { utms, clickIds };
}
