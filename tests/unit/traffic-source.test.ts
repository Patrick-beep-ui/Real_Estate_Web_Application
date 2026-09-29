/// <reference types="jest" />

import {
  getClickIds,
  getTrafficSourceLabel,
  captureAttribution,
  mergeLiveAndSession,
} from "@/lib/tracking/traffic-source";

const clearGoogleCookies = () => {
  document.cookie = "_gcl_aw=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = "_gcl_gb=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = "_fbp=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = "_fbc=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
};

const setUrl = (search = "") => {
  window.history.replaceState({}, "", `/${search}`);
};

const clearAttributionStorage = () => {
  localStorage.removeItem("tbh_attribution");
  sessionStorage.removeItem("tbh_attribution_session");
};

const setReferrer = (referrer = "") => {
  Object.defineProperty(document, "referrer", { configurable: true, value: referrer });
};

const originalGetEntriesByType = performance.getEntriesByType;

const getSessionAttribution = () => {
  const raw = sessionStorage.getItem("tbh_attribution_session");
  return raw ? JSON.parse(raw) : null;
};

describe("traffic-source click IDs", () => {
  beforeEach(() => {
    clearGoogleCookies();
    setUrl();
  });

  afterEach(() => {
    clearGoogleCookies();
    setUrl();
  });

  it("keeps URL click IDs separate", () => {
    setUrl("?gclid=gclid-1&gbraid=gbraid-1&wbraid=wbraid-1&fbclid=fbclid-1&msclkid=msclkid-1&fb_adset_id=adset-1&fb_campaign_id=campaign-1&fb_ad_id=ad-1");

    expect(getClickIds()).toEqual({
      gclid: "gclid-1",
      gbraid: "gbraid-1",
      wbraid: "wbraid-1",
      fbclid: "fbclid-1",
      fb_adset_id: "adset-1",
      fb_campaign_id: "campaign-1",
      fb_ad_id: "ad-1",
      msclkid: "msclkid-1",
    });
  });

  it("captures Meta Ads dynamic URL params", () => {
    setUrl("?fb_adset_id=adset-9&fb_campaign_id=campaign-9&fb_ad_id=ad-9&utm_id=utm-9");

    expect(getClickIds()).toMatchObject({
      fb_adset_id: "adset-9",
      fb_campaign_id: "campaign-9",
      fb_ad_id: "ad-9",
      gclid: null,
      fbclid: null,
    });
  });

  it("uses linker cookies for Google UTM traffic without a click ID", () => {
    setUrl("?utm_source=google&utm_medium=cpc");
    document.cookie = "_gcl_aw=GCL.1720000000.cookie.gclid; path=/";
    document.cookie = "_gcl_gb=GCL.1720000000.cookie.gbraid; path=/";

    expect(getClickIds()).toMatchObject({
      gclid: "cookie.gclid",
      gbraid: "cookie.gbraid",
      wbraid: null,
    });
  });

  it("does not use a stale gbraid cookie when wbraid is explicit", () => {
    setUrl("?wbraid=wbraid-1");
    document.cookie = "_gcl_gb=GCL.1720000000.stale-gbraid; path=/";

    expect(getClickIds()).toMatchObject({
      gclid: null,
      gbraid: null,
      wbraid: "wbraid-1",
    });
  });

  it("does not use stale linker cookies when gclid is explicit", () => {
    setUrl("?gclid=gclid-1");
    document.cookie = "_gcl_gb=GCL.1720000000.stale-gbraid; path=/";

    expect(getClickIds()).toMatchObject({
      gclid: "gclid-1",
      gbraid: null,
      wbraid: null,
    });
  });

  it("does not use stale Google cookies for direct or Meta traffic", () => {
    document.cookie = "_gcl_aw=GCL.1720000000.stale-gclid; path=/";
    document.cookie = "_gcl_gb=GCL.1720000000.stale-gbraid; path=/";

    expect(getClickIds()).toMatchObject({ gclid: null, gbraid: null, wbraid: null });

    setUrl("?utm_source=facebook&utm_medium=paid_social");

    expect(getClickIds()).toMatchObject({ gclid: null, gbraid: null, wbraid: null });
  });

  it("ignores invalid linker cookies", () => {
    setUrl("?utm_source=adwords");
    document.cookie = "_gcl_aw=not-a-linker-cookie; path=/";
    document.cookie = "_gcl_gb=GCL.1720000000; path=/";

    expect(getClickIds()).toMatchObject({ gclid: null, gbraid: null, wbraid: null });
  });

  it.each(["gclid", "gbraid", "wbraid"])("classifies %s as Google Ads", (clickId) => {
    expect(getTrafficSourceLabel({ [clickId]: "click-id" })).toBe("Google Ads");
  });

  it.each(["fb_adset_id", "fb_campaign_id"])("classifies %s as Meta Ads", (field) => {
    expect(getTrafficSourceLabel({ [field]: "123" })).toBe("Meta Ads");
  });

  it("does not classify utm_id alone as an ad platform", () => {
    expect(getTrafficSourceLabel({ utm_id: "123" })).toBe("Direct / Organic");
  });
});

describe("traffic-source session attribution", () => {
  beforeEach(() => {
    clearGoogleCookies();
    clearAttributionStorage();
    setUrl();
    setReferrer();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Object.defineProperty(performance, "getEntriesByType", {
      configurable: true,
      value: originalGetEntriesByType,
    });
    clearGoogleCookies();
    clearAttributionStorage();
    setUrl();
    setReferrer();
  });

  it("stores attribution for a direct landing with click IDs", () => {
    setUrl("?gclid=gclid-1&utm_source=google&utm_medium=cpc&utm_campaign=summer");

    captureAttribution({ isDocumentEntry: true });

    expect(getSessionAttribution()).toMatchObject({
      utms: { utm_source: "google", utm_medium: "cpc", utm_campaign: "summer" },
      clickIds: { gclid: "gclid-1" },
    });
  });

  it("stores attribution for a direct UTM-only landing", () => {
    setUrl("?utm_source=newsletter&utm_medium=email");

    captureAttribution({ isDocumentEntry: true });

    expect(getSessionAttribution()).toMatchObject({
      utms: { utm_source: "newsletter", utm_medium: "email" },
      clickIds: { gclid: null },
    });
  });

  it("does not write an all-null attribution object for an organic landing", () => {
    captureAttribution({ isDocumentEntry: true });

    expect(getSessionAttribution()).toBeNull();
  });

  it("keeps paid attribution through a clean internal navigation", () => {
    setUrl("?gclid=gclid-1&utm_source=google");
    captureAttribution({ isDocumentEntry: true });

    setUrl();
    captureAttribution({ isDocumentEntry: false });

    expect(getSessionAttribution()?.clickIds.gclid).toBe("gclid-1");
    expect(getSessionAttribution()?.utms.utm_source).toBe("google");
  });

  it.each(["reload", "back_forward"])("keeps paid attribution after %s navigation", (type) => {
    setUrl("?fbclid=fbclid-1&utm_source=facebook");
    captureAttribution({ isDocumentEntry: true });
    setUrl();
    Object.defineProperty(performance, "getEntriesByType", {
      configurable: true,
      value: () => [{ type }],
    });

    captureAttribution({ isDocumentEntry: true });

    expect(getSessionAttribution()).toMatchObject({
      utms: { utm_source: "facebook" },
      clickIds: { fbclid: "fbclid-1" },
    });
  });

  it("replaces stale session attribution with a live URL after history restore", () => {
    setUrl("?gclid=gclid-b&utm_source=google");
    captureAttribution({ isDocumentEntry: true });
    setUrl("?fbclid=fbclid-a&utm_source=facebook");
    setReferrer(`${window.location.origin}/markets`);
    Object.defineProperty(performance, "getEntriesByType", {
      configurable: true,
      value: () => [{ type: "back_forward" }],
    });

    captureAttribution({ isDocumentEntry: true });

    expect(getSessionAttribution()).toMatchObject({
      utms: { utm_source: "facebook" },
      clickIds: { gclid: null, fbclid: "fbclid-a" },
    });
    expect(mergeLiveAndSession().clickIds).toMatchObject({ gclid: null, fbclid: "fbclid-a" });
  });

  it("supersedes session attribution when a fresh explicit ad click ID appears", () => {
    setUrl("?gclid=old-gclid");
    captureAttribution({ isDocumentEntry: true });

    setUrl("?gclid=new-gclid");
    captureAttribution({ isDocumentEntry: false });

    expect(getSessionAttribution()?.clickIds.gclid).toBe("new-gclid");
  });

  it("replaces paid attribution on an external organic document entry", () => {
    setUrl("?gclid=gclid-1&utm_source=google&utm_campaign=summer");
    captureAttribution({ isDocumentEntry: true });

    setUrl("");
    setReferrer("https://search.example/results");
    captureAttribution({ isDocumentEntry: true });

    expect(getSessionAttribution()).toBeNull();
  });

  it("replaces paid attribution on a direct document entry", () => {
    setUrl("?gclid=gclid-1&utm_source=google");
    captureAttribution({ isDocumentEntry: true });

    setUrl();
    setReferrer();
    captureAttribution({ isDocumentEntry: true });

    expect(getSessionAttribution()).toBeNull();
  });

  it("replaces paid attribution on a new external tagged landing", () => {
    setUrl("?gclid=old-gclid&utm_source=google");
    captureAttribution({ isDocumentEntry: true });

    setUrl("?utm_source=newsletter&utm_medium=email");
    setReferrer("https://newsletter.example/campaign");
    captureAttribution({ isDocumentEntry: true });

    expect(getSessionAttribution()).toMatchObject({
      utms: { utm_source: "newsletter", utm_medium: "email" },
      clickIds: { gclid: null },
    });
  });

  it("merges session attribution into a clean internal route", () => {
    setUrl("?gclid=gclid-1&utm_source=google&utm_campaign=summer");
    captureAttribution({ isDocumentEntry: true });

    setUrl();
    captureAttribution({ isDocumentEntry: false });
    const merged = mergeLiveAndSession();

    expect(merged.clickIds.gclid).toBe("gclid-1");
    expect(merged.utms.utm_source).toBe("google");
    expect(merged.utms.utm_campaign).toBe("summer");
  });

  it("prefers live values over active session attribution", () => {
    setUrl("?gclid=old-gclid");
    captureAttribution({ isDocumentEntry: true });

    setUrl("?gclid=new-gclid");
    expect(mergeLiveAndSession().clickIds.gclid).toBe("new-gclid");
  });

  it("treats a poisoned all-null session snapshot as absent", () => {
    sessionStorage.setItem("tbh_attribution_session", JSON.stringify({
      utms: { utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null, utm_term: null, utm_id: null },
      clickIds: { gclid: null, gbraid: null, wbraid: null, fbclid: null, fb_adset_id: null, fb_campaign_id: null, msclkid: null },
    }));

    expect(mergeLiveAndSession().clickIds.gclid).toBeNull();
    expect(sessionStorage.getItem("tbh_attribution_session")).toBeNull();
  });

  it("removes the legacy local snapshot without ever merging it", () => {
    localStorage.setItem("tbh_attribution", JSON.stringify({ clickIds: { gclid: "legacy-gclid" } }));
    captureAttribution({ isDocumentEntry: true });

    expect(localStorage.getItem("tbh_attribution")).toBeNull();
    expect(mergeLiveAndSession().clickIds.gclid).toBeNull();
  });

  it("treats malformed session storage as absent", () => {
    sessionStorage.setItem("tbh_attribution_session", "not-json");

    expect(mergeLiveAndSession().clickIds.gclid).toBeNull();
    expect(sessionStorage.getItem("tbh_attribution_session")).toBeNull();
  });

  it("returns only live values when there is no active session attribution", () => {
    setUrl("?utm_source=direct");

    expect(mergeLiveAndSession()).toMatchObject({
      utms: { utm_source: "direct" },
      clickIds: {},
    });
  });

  it("clears malformed legacy storage on document entry", () => {
    localStorage.setItem("tbh_attribution", "not-json");

    captureAttribution({ isDocumentEntry: true });
    expect(localStorage.getItem("tbh_attribution")).toBeNull();
  });
});
