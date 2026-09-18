const TAG = "[TBH:traffic-source]";

export function getTrafficSourceLabel(data: {
  utm_source?: string | null;
  gclid?: string | null;
  gbraid?: string | null;
  wbraid?: string | null;
  fbclid?: string | null;
  msclkid?: string | null;
}): string {
  if (data.gclid || data.gbraid || data.wbraid || data.utm_source === "adwords") return "Google Ads";
  if (data.fbclid || data.utm_source === "facebook" || data.utm_source === "meta") return "Meta Ads";
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
