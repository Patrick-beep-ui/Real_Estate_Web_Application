/**
 * GA4 + Meta Pixel + Google Ads analytics infrastructure.
 *
 * Consent ownership: the cookie preference controls optional site analytics
 * (GA4) only. Google Ads conversions, Meta Pixel events, Meta CAPI events,
 * and attribution beacons run regardless of the stored preference.
 */

import { hasAnalyticsConsent } from "@/components/widgets/CookieConsent";

const TAG = "[TBH:analytics]";

// ── Configuration ────────────────────────────────────────────
const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || "";
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID || "";
const GOOGLE_ADS_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL || "";

let googleTagLoaded = false;
let ga4Configured = false;
let adsConfigured = false;
let metaLoaded = false;

type GtagFn = (...args: unknown[]) => void;

function getGtag(): GtagFn | null {
  const gtag = (window as Window & { gtag?: GtagFn }).gtag;
  return typeof gtag === "function" ? gtag : null;
}

// ── Google tag (shared script, never consent-gated) ──────────
function loadGoogleTag() {
  if (googleTagLoaded || (!GA4_MEASUREMENT_ID && !GOOGLE_ADS_ID)) {
    console.log(`${TAG} Google tag skip: loaded=${googleTagLoaded}, GA4=${GA4_MEASUREMENT_ID ? "set" : "EMPTY"}, GAds=${GOOGLE_ADS_ID ? "set" : "EMPTY"}`);
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
    if (!getGtag()) {
      const gtagWindow = window as Window & { gtag?: GtagFn };
      gtagWindow.gtag = (...args: unknown[]) => {
        (window as any).dataLayer.push(args);
      };
    }
    getGtag()?.("js", new Date());

    googleTagLoaded = true;
    console.log(`${TAG} ✔ Google tag initialized`);
  } catch (e) {
    console.error(`${TAG} loadGoogleTag failed:`, e);
  }
}

// ── GA4 (opt-in only) ────────────────────────────────────────
function configureGA4() {
  if (ga4Configured || !googleTagLoaded || !GA4_MEASUREMENT_ID) {
    console.log(`${TAG} GA4 skip: configured=${ga4Configured}, tagLoaded=${googleTagLoaded}, GA4=${GA4_MEASUREMENT_ID ? "set" : "EMPTY"}`);
    return;
  }
  if (!hasAnalyticsConsent()) {
    console.log(`${TAG} ⏭ GA4 not configured — site analytics not allowed`);
    return;
  }

  try {
    getGtag()?.("config", GA4_MEASUREMENT_ID, {
      send_page_view: true,
      cookie_flags: "SameSite=None;Secure",
    });
    ga4Configured = true;
    console.log(`${TAG} ✔ GA4 configured: ${GA4_MEASUREMENT_ID}`);
  } catch (e) {
    console.error(`${TAG} configureGA4 failed:`, e);
  }
}

// ── Google Ads (never consent-gated) ─────────────────────────
function configureGoogleAds() {
  if (adsConfigured || !googleTagLoaded || !GOOGLE_ADS_ID) {
    console.log(`${TAG} Google Ads skip: configured=${adsConfigured}, tagLoaded=${googleTagLoaded}, ID=${GOOGLE_ADS_ID ? "set" : "EMPTY"}`);
    return;
  }

  try {
    getGtag()?.("config", GOOGLE_ADS_ID);
    adsConfigured = true;
    console.log(`${TAG} ✔ Google Ads configured: ${GOOGLE_ADS_ID}`);
  } catch (e) {
    console.error(`${TAG} configureGoogleAds failed:`, e);
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

/**
 * Initialize tracking. Call on first load and on preference change.
 * Google Ads and Meta start regardless of the cookie preference; GA4 starts
 * only when site analytics are allowed.
 */
export function initAnalytics() {
  const analyticsConsent = hasAnalyticsConsent();
  console.log(`${TAG} initAnalytics() — analyticsConsent=${analyticsConsent}, googleTagLoaded=${googleTagLoaded}, ga4Configured=${ga4Configured}, adsConfigured=${adsConfigured}, metaLoaded=${metaLoaded}`);

  loadGoogleTag();
  configureGoogleAds();
  configureGA4();
  loadMetaPixel();
}

/** Track a custom event. GA4 requires site analytics; Meta never does. */
export function trackConversion(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  console.log(`${TAG} trackConversion("${eventName}")`, params);

  if (hasAnalyticsConsent()) {
    try {
      const gtag = getGtag();
      if (gtag) {
        gtag("event", eventName, params);
        console.log(`${TAG}   → GA4 event fired`);
      } else {
        console.log(`${TAG}   → GA4 not available (configured=${ga4Configured})`);
      }
    } catch (e) {
      console.error(`${TAG} trackConversion GA4 failed:`, e);
    }
  } else {
    console.log(`${TAG}   ⏭ GA4 event skipped — site analytics not allowed`);
  }

  try {
    if (typeof (window as any).fbq === "function") {
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
  /** Advanced matching values; fbq normalizes and hashes them client-side. */
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
}) {
  const logParams = {
    market: params.market,
    situation: params.situation,
    source: params.source,
    hasEventId: Boolean(params.eventId),
    hasEmail: Boolean(params.email),
    hasPhone: Boolean(params.phone),
    hasFirstName: Boolean(params.firstName),
  };
  const consent = hasAnalyticsConsent();
  console.log(`${TAG} trackLeadSubmission()`, logParams);

  if (consent) {
    try {
      const gtag = getGtag();
      if (gtag) {
        // GA4 lead event
        gtag("event", "generate_lead", {
          currency: "USD",
          value: params.value || 0,
          event_category: "lead",
          market: params.market,
          situation: params.situation,
          source: params.source,
        });
        console.log(`${TAG}   → GA4 generate_lead fired`);
      } else {
        console.log(`${TAG}   → GA4 not available for generate_lead`);
      }
    } catch (e) {
      console.error(`${TAG} trackLeadSubmission GA4 failed:`, e);
    }
  } else {
    console.log(`${TAG}   ⏭ GA4 generate_lead skipped — site analytics not allowed`);
  }

  // Google Ads conversion is advertising measurement, never consent-gated.
  try {
    const gtag = getGtag();
    if (gtag && GOOGLE_ADS_ID && GOOGLE_ADS_LABEL) {
      gtag("event", "conversion", {
        send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_LABEL}`,
        value: params.value || 0,
        currency: "USD",
      });
      console.log(`${TAG}   → Google Ads conversion fired`);
    } else {
      console.log(`${TAG}   → Google Ads conversion skipped (tag=${!!gtag}, ID=${GOOGLE_ADS_ID ? "set" : "EMPTY"}, label=${GOOGLE_ADS_LABEL ? "set" : "EMPTY"})`);
    }
  } catch (e) {
    console.error(`${TAG} trackLeadSubmission Google Ads failed:`, e);
  }

  try {
    if (typeof (window as any).fbq === "function") {
      // Event-level matching preserves the existing landing-page fbc/fbp state.
      // Do not re-init the Pixel at submit time because that can replace fbc.
      const em = params.email?.trim().toLowerCase() || undefined;
      const ph = params.phone?.replace(/\D/g, "") || undefined;
      const fn = params.firstName?.trim().toLowerCase() || undefined;
      const userData: Record<string, string> = {};
      if (em) userData.em = em;
      if (ph) userData.ph = ph;
      if (fn) userData.fn = fn;
      const options: Record<string, unknown> = {};
      if (params.eventId) options.eventID = params.eventId;
      if (Object.keys(userData).length > 0) options.user_data = userData;

      (window as any).fbq(
        "track",
        "Lead",
        {
          content_name: `${params.market}_${params.situation}`,
          content_category: params.source,
          value: params.value || 0,
          currency: "USD",
        },
        Object.keys(options).length > 0 ? options : undefined
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

// ── Auto-init on preference change ───────────────────────────
if (typeof window !== "undefined") {
  window.addEventListener("cookie_consent_change", (e: any) => {
    console.log(`${TAG} cookie_consent_change event received:`, e.detail);
    // Idempotent: configures GA4 only when site analytics are newly allowed,
    // and never re-configures Google Ads or Meta.
    initAnalytics();
  });
}
