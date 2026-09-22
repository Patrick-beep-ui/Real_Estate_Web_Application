const TAG = "[TBH:traffic-source]";
const ATTRIBUTION_SESSION_STORAGE_KEY = "tbh_attribution_session";
const LEGACY_ATTRIBUTION_STORAGE_KEY = "tbh_attribution";

type UtmParams = ReturnType<typeof getUtmParams>;
type ClickIds = ReturnType<typeof getClickIds>;

interface AttributionData {
  utms: UtmParams;
  clickIds: ClickIds;
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
    // Attribution is best-effort when browser storage is unavailable.
  }
}

function safeSessionStorageRemove(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Attribution is best-effort when browser storage is unavailable.
  }
}

function removeLegacyAttribution(): void {
  try {
    window.localStorage.removeItem(LEGACY_ATTRIBUTION_STORAGE_KEY);
  } catch {
    // Legacy storage is never read, so failure cannot affect attribution.
  }
}

function hasAttributionData({ utms, clickIds }: AttributionData): boolean {
  return [...Object.values(utms), ...Object.values(clickIds)].some(Boolean);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isAttributionData(value: unknown): value is AttributionData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  if (!candidate.utms || typeof candidate.utms !== "object" || !candidate.clickIds || typeof candidate.clickIds !== "object") return false;

  const utms = candidate.utms as Record<string, unknown>;
  const clickIds = candidate.clickIds as Record<string, unknown>;
  const utmKeys: Array<keyof UtmParams> = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id"];
  const clickIdKeys: Array<keyof ClickIds> = ["gclid", "gbraid", "wbraid", "fbclid", "fb_adset_id", "fb_campaign_id", "msclkid"];

  return utmKeys.every((key) => isNullableString(utms[key])) && clickIdKeys.every((key) => isNullableString(clickIds[key]));
}

function readSessionAttribution(): AttributionData | null {
  const raw = safeSessionStorageGet(ATTRIBUTION_SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const attribution = JSON.parse(raw) as unknown;
    if (isAttributionData(attribution) && hasAttributionData(attribution)) return attribution;
  } catch {
    // Invalid data is removed below.
  }

  // Malformed and all-null values must not leak into later submissions.
  safeSessionStorageRemove(ATTRIBUTION_SESSION_STORAGE_KEY);
  return null;
}

function writeSessionAttribution(attribution: AttributionData): void {
  if (!hasAttributionData(attribution)) {
    safeSessionStorageRemove(ATTRIBUTION_SESSION_STORAGE_KEY);
    return;
  }
  safeSessionStorageSet(ATTRIBUTION_SESSION_STORAGE_KEY, JSON.stringify(attribution));
}

function isExternalOrDirectDocumentEntry(): boolean {
  try {
    if (!document.referrer) return true;
    return new URL(document.referrer).origin !== window.location.origin;
  } catch {
    return true;
  }
}

function getLiveAttribution(): AttributionData {
  return { utms: getUtmParams(), clickIds: getClickIds() };
}

/**
 * Capture live UTM/click data. Direct and external document entries reset the
 * active session when the current URL is organic; clean internal navigation
 * preserves the existing session attribution.
 */
export function captureAttribution({ isDocumentEntry }: { isDocumentEntry: boolean }): void {
  const liveAttribution = getLiveAttribution();

  if (isDocumentEntry) {
    removeLegacyAttribution();
    if (isExternalOrDirectDocumentEntry()) {
      writeSessionAttribution(liveAttribution);
      return;
    }
  }

  if (hasAttributionData(liveAttribution)) {
    writeSessionAttribution(liveAttribution);
  }
}

/** Merge live URL attribution with the active tab session. Live values win. */
export function mergeLiveAndSession(): AttributionData {
  const liveUtms = getUtmParams();
  const liveClickIds = getClickIds();
  const sessionAttribution = readSessionAttribution();
  if (!sessionAttribution) return { utms: liveUtms, clickIds: liveClickIds };

  const utms = Object.fromEntries(
    Object.entries(sessionAttribution.utms).map(([key, value]) => [
      key,
      liveUtms[key as keyof UtmParams] || value,
    ])
  ) as UtmParams;
  const clickIds = Object.fromEntries(
    Object.entries(sessionAttribution.clickIds).map(([key, value]) => [
      key,
      liveClickIds[key as keyof ClickIds] || value,
    ])
  ) as ClickIds;

  return { utms, clickIds };
}
