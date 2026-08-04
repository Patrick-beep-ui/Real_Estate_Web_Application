/**
 * GA4 + Meta Pixel + Google Ads analytics infrastructure.
 */

import { hasAnalyticsConsent } from "@/components/widgets/CookieConsent";

const TAG = "[TBH:analytics]";

// ── Configuration ────────────────────────────────────────────
const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || "";
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID || "";

let ga4Loaded = false;
let metaLoaded = false;

// ── GA4 + Google Ads ─────────────────────────────────────────
function loadGA4() {
  if (ga4Loaded || (!GA4_MEASUREMENT_ID && !GOOGLE_ADS_ID)) {
    console.log(`${TAG} GA4 skip: loaded=${ga4Loaded}, GA4=${GA4_MEASUREMENT_ID ? "set" : "EMPTY"}, GAds=${GOOGLE_ADS_ID ? "set" : "EMPTY"}`);
    return;
  }

  try {
    const trackingId = GA4_MEASUREMENT_ID || GOOGLE_ADS_ID;
    console.log(`${TAG} Loading gtag script (ID: ${trackingId})...`);
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    script.onload = () => console.log(`${TAG} ✔ gtag script loaded`);
    script.onerror = () => console.error(`${TAG} ✘ gtag script FAILED to load`);
    document.head.appendChild(script);

    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    }
    (window as any).gtag = gtag;
    gtag("js", new Date());

    if (GA4_MEASUREMENT_ID) {
      gtag("config", GA4_MEASUREMENT_ID, {
        send_page_view: true,
        cookie_flags: "SameSite=None;Secure",
      });
    }

    if (GOOGLE_ADS_ID) {
      gtag("config", GOOGLE_ADS_ID);
      console.log(`${TAG} ✔ Google Ads configured: ${GOOGLE_ADS_ID}`);
    }

    ga4Loaded = true;
    console.log(`${TAG} ✔ GA4/Ads initialized`);
  } catch (e) {
    console.error(`${TAG} loadGA4 failed:`, e);
  }
}

// ── Meta Pixel ───────────────────────────────────────────────
function loadMetaPixel() {
  if (metaLoaded || !META_PIXEL_ID) {
    console.log(`${TAG} Meta Pixel skip: loaded=${metaLoaded}, ID=${META_PIXEL_ID ? "set" : "EMPTY"}`);
    return;
  }
  try {
    console.log(`${TAG} Loading Meta Pixel (ID: ${META_PIXEL_ID})...`);
    const f = window as any;
    if (f.fbq) return;

    const n: any = (f.fbq = function (...args: any[]) {
      n.callMethod ? n.callMethod(...args) : n.queue.push(args);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.onload = () => console.log(`${TAG} ✔ Meta Pixel script loaded`);
    script.onerror = () => console.error(`${TAG} ✘ Meta Pixel script FAILED to load`);
    document.head.appendChild(script);

    f.fbq("init", META_PIXEL_ID);
    f.fbq("track", "PageView");
    metaLoaded = true;
    console.log(`${TAG} ✔ Meta Pixel initialized`);
  } catch (e) {
    console.error(`${TAG} loadMetaPixel failed:`, e);
  }
}

// ── Public API ───────────────────────────────────────────────

/** Initialize analytics if consent is granted. Call on load + consent change. */
export function initAnalytics() {
  const consent = hasAnalyticsConsent();
  console.log(`${TAG} initAnalytics() — consent=${consent}, ga4Loaded=${ga4Loaded}, metaLoaded=${metaLoaded}`);
  if (!consent) {
    console.log(`${TAG} ⏭ Skipping init — no analytics consent`);
    return;
  }
  loadGA4();
  loadMetaPixel();
}

/** Track a custom event across both platforms */
export function trackConversion(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  const consent = hasAnalyticsConsent();
  if (!consent) {
    console.log(`${TAG} trackConversion("${eventName}") SKIPPED — no consent`);
    return;
  }

  console.log(`${TAG} trackConversion("${eventName}")`, params);

  try {
    if (ga4Loaded && (window as any).gtag) {
      (window as any).gtag("event", eventName, params);
      console.log(`${TAG}   → GA4 event fired`);
    } else {
      console.log(`${TAG}   → GA4 not available (loaded=${ga4Loaded})`);
    }
  } catch (e) {
    console.error(`${TAG} trackConversion GA4 failed:`, e);
  }

  try {
    if (metaLoaded && (window as any).fbq) {
      (window as any).fbq("trackCustom", eventName, params);
      console.log(`${TAG}   → Meta Pixel event fired`);
    } else {
      console.log(`${TAG}   → Meta Pixel not available (loaded=${metaLoaded})`);
    }
  } catch (e) {
    console.error(`${TAG} trackConversion Meta failed:`, e);
  }
}

/** Track standard Meta Lead event + GA4 generate_lead + Google Ads conversion */
export function trackLeadSubmission(params: {
  market: string;
  situation: string;
  source: string;
  value?: number;
  /** Shared with the server CAPI Lead event so Meta deduplicates the pair */
  eventId?: string;
}) {
  const consent = hasAnalyticsConsent();
  if (!consent) {
    console.log(`${TAG} trackLeadSubmission() SKIPPED — no consent`, params);
    return;
  }

  console.log(`${TAG} trackLeadSubmission()`, params);

  try {
    if (ga4Loaded && (window as any).gtag) {
      // GA4 lead event
      (window as any).gtag("event", "generate_lead", {
        currency: "USD",
        value: params.value || 0,
        event_category: "lead",
        market: params.market,
        situation: params.situation,
        source: params.source,
      });
      console.log(`${TAG}   → GA4 generate_lead fired`);

      // Google Ads conversion
      const conversionLabel = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL || "";
      if (GOOGLE_ADS_ID && conversionLabel) {
        (window as any).gtag("event", "conversion", {
          send_to: `${GOOGLE_ADS_ID}/${conversionLabel}`,
          value: params.value || 0,
          currency: "USD",
        });
        console.log(`${TAG}   → Google Ads conversion fired`);
      }
    } else {
      console.log(`${TAG}   → GA4 not available for generate_lead`);
    }
  } catch (e) {
    console.error(`${TAG} trackLeadSubmission GA4/Ads failed:`, e);
  }

  try {
    if (metaLoaded && (window as any).fbq) {
      (window as any).fbq(
        "track",
        "Lead",
        {
          content_name: `${params.market}_${params.situation}`,
          content_category: params.source,
          value: params.value || 0,
          currency: "USD",
        },
        params.eventId ? { eventID: params.eventId } : undefined
      );
      console.log(`${TAG}   → Meta Pixel Lead event fired`);
    } else {
      console.log(`${TAG}   → Meta Pixel not available for Lead event`);
    }
  } catch (e) {
    console.error(`${TAG} trackLeadSubmission Meta failed:`, e);
  }
}

/** Track phone call click */
export function trackPhoneClick(market: string, situation: string) {
  console.log(`${TAG} trackPhoneClick(${market}, ${situation})`);
  trackConversion("phone_click", { market, situation });

  try {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("trackCustom", "ClickToCall", {
        market,
        situation,
      });
    }
  } catch (e) {
    console.error(`${TAG} trackPhoneClick Meta failed:`, e);
  }
}

/** Track SMS click */
export function trackSMSClick(market: string, situation: string) {
  console.log(`${TAG} trackSMSClick(${market}, ${situation})`);
  trackConversion("sms_click", { market, situation });
}

/** Track form view (impression) */
export function trackFormView(source: string, market: string, situation: string) {
  console.log(`${TAG} trackFormView(${source}, ${market}, ${situation})`);
  trackConversion("form_view", { source, market, situation });
}

// ── Auto-init on consent change ──────────────────────────────
if (typeof window !== "undefined") {
  window.addEventListener("cookie_consent_change", (e: any) => {
    console.log(`${TAG} cookie_consent_change event received:`, e.detail);
    if (e.detail?.level === "all") {
      initAnalytics();
    }
  });
}
