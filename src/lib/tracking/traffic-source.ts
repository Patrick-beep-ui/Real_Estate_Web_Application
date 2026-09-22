import { Tag } from "lucide-react";

const TAG = "[TBH:traffic-source]";
const ATTRIBUTION_SESSION_STORAGE_KEY = "tbh_attribution_session";
const LEGACY_ATTRIBUTION_STORAGE_KEY = "tbh_attribution";

type UtmParams = ReturnType<typeof getUtmParams>;
type ClickIds = ReturnType<typeof getClickIds>;

interface AttributionData {
  utms: UtmParams;
  clickIds: ClickIds;
}

interface AttributionSession {
  version: 1;
  sessionId: string;
  startedAt: number;
  landing: {
    type: "paid" | "tagged" | "organic";
    path: string;
    referrerOrigin: string | null;
  };
  attribution: AttributionData | null;
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
  if (data.fbclid || data.fb_adset_id || data.fb_campaign_id || data.utm_source === "facebook" || data.utm_source === "meta") {
    return "Meta Ads";
  }
  if (data.msclkid) return "Microsoft Ads";
  return "Direct / Organic";
}

/** Extract UTM params from current URL. */
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

function safeSessionStorageGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionStorageSet(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Session attribution is best-effort when browser storage is unavailable.
  }
}

function safeLegacyStorageRemove(): void {
  try {
    window.localStorage.removeItem(LEGACY_ATTRIBUTION_STORAGE_KEY);
  } catch {
    // Legacy storage cannot affect attribution because it is never read.
  }
}

function hasAttributionData({ utms, clickIds }: AttributionData): boolean {
  return [...Object.values(utms), ...Object.values(clickIds)].some(Boolean);
}

function normalizeAttribution(value: unknown): AttributionData | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const utmSource = source.utms && typeof source.utms === "object" ? source.utms as Record<string, unknown> : {};
  const clickSource = source.clickIds && typeof source.clickIds === "object" ? source.clickIds as Record<string, unknown> : {};
  const read = (fields: Record<string, unknown>, key: string): string | null => typeof fields[key] === "string" ? fields[key] : null;
  const attribution = {
    utms: {
      utm_source: read(utmSource, "utm_source"),
      utm_medium: read(utmSource, "utm_medium"),
      utm_campaign: read(utmSource, "utm_campaign"),
      utm_content: read(utmSource, "utm_content"),
      utm_term: read(utmSource, "utm_term"),
      utm_id: read(utmSource, "utm_id"),
    },
    clickIds: {
      gclid: read(clickSource, "gclid"),
      gbraid: read(clickSource, "gbraid"),
      wbraid: read(clickSource, "wbraid"),
      fbclid: read(clickSource, "fbclid"),
      fb_adset_id: read(clickSource, "fb_adset_id"),
      fb_campaign_id: read(clickSource, "fb_campaign_id"),
      msclkid: read(clickSource, "msclkid"),
    },
  };
  return hasAttributionData(attribution) ? attribution : null;
}

function readAttributionSession(): AttributionSession | null {
  const raw = safeSessionStorageGet(ATTRIBUTION_SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<AttributionSession>;
    if (
      parsed.version !== 1 ||
      typeof parsed.sessionId !== "string" ||
      typeof parsed.startedAt !== "number" ||
      !parsed.landing ||
      typeof parsed.landing !== "object" ||
      !["paid", "tagged", "organic"].includes(parsed.landing.type || "")
    ) {
      return null;
    }

    const session: AttributionSession = {
      version: 1,
      sessionId: parsed.sessionId,
      startedAt: parsed.startedAt,
      landing: {
        type: parsed.landing.type as AttributionSession["landing"]["type"],
        path: typeof parsed.landing.path === "string" ? parsed.landing.path : "/",
        referrerOrigin: typeof parsed.landing.referrerOrigin === "string" ? parsed.landing.referrerOrigin : null,
      },
      attribution: normalizeAttribution(parsed.attribution),
    };

    // Rewrite poisoned all-null records as an explicit organic session.
    if (parsed.attribution && !session.attribution) {
      session.landing.type = "organic";
      safeSessionStorageSet(ATTRIBUTION_SESSION_STORAGE_KEY, JSON.stringify(session));
    }
    return session;
  } catch {
    return null;
  }
}

function getReferrerOrigin(): string | null {
  try {
    return document.referrer ? new URL(document.referrer).origin : null;
  } catch {
    return null;
  }
}

function isExternalOrDirectDocumentEntry(): boolean {
  const referrerOrigin = getReferrerOrigin();
  return !referrerOrigin || referrerOrigin !== window.location.origin;
}

function liveHasExplicitAttribution(params: URLSearchParams): boolean {
  return [
    params.get("gclid"),
    params.get("gbraid"),
    params.get("wbraid"),
    params.get("fbclid"),
    params.get("msclkid"),
    params.get("utm_id"),
    params.get("fb_adset_id"),
    params.get("fb_campaign_id"),
  ].some(Boolean);
}

function createSession(attribution: AttributionData | null, referrerOrigin: string | null): AttributionSession {
  const params = new URLSearchParams(window.location.search);
  const type = !attribution ? "organic" : liveHasExplicitAttribution(params) || Object.values(attribution.clickIds).some(Boolean) ? "paid" : "tagged";
  const session: AttributionSession = {
    version: 1,
    sessionId: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `tbh-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    startedAt: Date.now(),
    landing: { type, path: window.location.pathname, referrerOrigin },
    attribution,
  };
  safeSessionStorageSet(ATTRIBUTION_SESSION_STORAGE_KEY, JSON.stringify(session));
  console.log(`${TAG} ${type} attribution session started at ${session.landing.path}`);
  return session;
}

function getLiveAttribution(): AttributionData | null {
  const attribution = { utms: getUtmParams(), clickIds: getClickIds() };
  return hasAttributionData(attribution) ? attribution : null;
}

/**
 * Run once for a browser document entry. Direct/external entries always start
 * a new session; same-site entries preserve the existing tab session unless
 * their URL carries new attribution.
 */
export function captureAttributionForDocumentEntry(): AttributionSession {
  safeLegacyStorageRemove();
  const liveAttribution = getLiveAttribution();
  const referrerOrigin = getReferrerOrigin();
  const existing = readAttributionSession();

  if (isExternalOrDirectDocumentEntry() || !existing || liveAttribution) {
    return createSession(liveAttribution, referrerOrigin);
  }
  return existing;
}

/**
 * Run for Next.js client-side navigation. A clean internal route preserves the
 * active session; a route carrying new UTM/click data replaces it.
 */
export function captureAttributionForClientNavigation(): AttributionSession | null {
  const liveAttribution = getLiveAttribution();
  if (!liveAttribution) return readAttributionSession();
  return createSession(liveAttribution, getReferrerOrigin());
}

/** Active tab-session attribution, never the legacy 30-day local snapshot. */
export function getSessionAttribution(): AttributionData | null {
  return readAttributionSession()?.attribution || null;
}

/** Merge live URL attribution with the active tab session. Live values win. */
export function mergeLiveAndSession(): AttributionData {
  const liveUtms = getUtmParams();
  const liveClickIds = getClickIds();
  const stored = getSessionAttribution();
  if (!stored) return { utms: liveUtms, clickIds: liveClickIds };

  const utms = Object.fromEntries(
    Object.entries(stored.utms).map(([key, value]) => [
      key,
      liveUtms[key as keyof UtmParams] || value,
    ])
  ) as UtmParams;
  const clickIds = Object.fromEntries(
    Object.entries(stored.clickIds).map(([key, value]) => [
      key,
      liveClickIds[key as keyof ClickIds] || value,
    ])
  ) as ClickIds;

  return { utms, clickIds };
}
