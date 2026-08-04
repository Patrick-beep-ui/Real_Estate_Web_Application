const TAG = "[TBH:traffic-source]";

export function getTrafficSourceLabel(data: {
  utm_source?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  msclkid?: string | null;
}): string {
  if (data.gclid || data.utm_source === "adwords") return "Google Ads";
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
    };
    console.log(`${TAG} UTM extraction:`, {
      utm_source: utms.utm_source || "(none)",
      utm_medium: utms.utm_medium || "(none)",
      utm_campaign: utms.utm_campaign || "(none)",
      utm_content: utms.utm_content || "(none)",
      utm_term: utms.utm_term || "(none)",
      raw_search: window.location.search || "(empty)",
    });
    return utms;
  } catch {
    console.warn(`${TAG} UTM extraction failed`);
    return { utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null, utm_term: null };
  }
}

/** Extract ad platform click IDs from current URL */
export function getClickIds() {
  try {
    const params = new URLSearchParams(window.location.search);
    const clickIds = {
      gclid: params.get("gclid") || params.get("gbraid") || params.get("wbraid") || null,
      fbclid: params.get("fbclid") || null,
      msclkid: params.get("msclkid") || null,
    };
    console.log(`${TAG} Click ID extraction:`, {
      gclid: clickIds.gclid ? "present" : "(none)",
      fbclid: clickIds.fbclid ? "present" : "(none)",
      msclkid: clickIds.msclkid ? "present" : "(none)",
    });
    return clickIds;
  } catch {
    console.warn(`${TAG} Click ID extraction failed`);
    return { gclid: null, fbclid: null, msclkid: null };
  }
}
