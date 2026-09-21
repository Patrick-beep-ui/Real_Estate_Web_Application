/// <reference types="jest" />

import {
  getClickIds,
  getTrafficSourceLabel,
  captureAttributionNow,
  getStoredAttribution,
  mergeLiveAndStored,
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
    setUrl("?gclid=gclid-1&gbraid=gbraid-1&wbraid=wbraid-1&fbclid=fbclid-1&msclkid=msclkid-1&fb_adset_id=adset-1&fb_campaign_id=campaign-1");

    expect(getClickIds()).toEqual({
      gclid: "gclid-1",
      gbraid: "gbraid-1",
      wbraid: "wbraid-1",
      fbclid: "fbclid-1",
      fb_adset_id: "adset-1",
      fb_campaign_id: "campaign-1",
      msclkid: "msclkid-1",
    });
  });

  it("captures Meta Ads dynamic URL params", () => {
    setUrl("?fb_adset_id=adset-9&fb_campaign_id=campaign-9&utm_id=ad-9");

    expect(getClickIds()).toMatchObject({
      fb_adset_id: "adset-9",
      fb_campaign_id: "campaign-9",
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

describe("traffic-source first-touch persistence", () => {
  beforeEach(() => {
    clearGoogleCookies();
    clearAttributionStorage();
    setUrl();
  });

  afterEach(() => {
    clearGoogleCookies();
    clearAttributionStorage();
    setUrl();
  });

  it("captures the landing snapshot with UTMs and click IDs", () => {
    setUrl("?gclid=gclid-1&utm_source=google&utm_medium=cpc&utm_campaign=summer");

    captureAttributionNow();

    expect(getStoredAttribution()).toMatchObject({
      capturedAt: expect.any(Number),
      pagePath: "/",
      utms: { utm_source: "google", utm_medium: "cpc", utm_campaign: "summer" },
      clickIds: { gclid: "gclid-1" },
    });
  });

  it("keeps the first snapshot when a later visit has no explicit click IDs", () => {
    setUrl("?gclid=gclid-1&utm_source=google");
    captureAttributionNow();

    setUrl("?utm_source=facebook");
    const result = captureAttributionNow();

    expect(result).toEqual(getStoredAttribution());
    expect(getStoredAttribution()?.clickIds.gclid).toBe("gclid-1");
    expect(getStoredAttribution()?.utms.utm_source).toBe("google");
  });

  it("supersedes the snapshot when a fresh explicit ad click ID appears", () => {
    setUrl("?gclid=old-gclid");
    captureAttributionNow();

    setUrl("?gclid=new-gclid");
    captureAttributionNow();

    expect(getStoredAttribution()?.clickIds.gclid).toBe("new-gclid");
  });

  it("merges stored attribution into a later URL that lost its params", () => {
    setUrl("?gclid=gclid-1&utm_source=google&utm_campaign=summer");
    captureAttributionNow();

    setUrl("");
    const merged = mergeLiveAndStored();

    expect(merged.clickIds.gclid).toBe("gclid-1");
    expect(merged.utms.utm_source).toBe("google");
    expect(merged.utms.utm_campaign).toBe("summer");
  });

  it("prefers live explicit click IDs over the stored snapshot", () => {
    setUrl("?gclid=old-gclid");
    captureAttributionNow();

    setUrl("?gclid=new-gclid");
    const merged = mergeLiveAndStored();

    expect(merged.clickIds.gclid).toBe("new-gclid");
  });

  it("returns only live values when nothing has been stored", () => {
    setUrl("?utm_source=direct");

    expect(mergeLiveAndStored()).toMatchObject({
      utms: { utm_source: "direct" },
      clickIds: {},
    });
  });

  it("ignores an expired snapshot", () => {
    setUrl("?utm_source=direct");
    const past = Date.now() - 31 * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      "tbh_attribution",
      JSON.stringify({
        capturedAt: past,
        pagePath: "/",
        utms: { utm_source: "google" },
        clickIds: { gclid: "gclid-1" },
      })
    );

    expect(getStoredAttribution()).toBeNull();
    expect(mergeLiveAndStored()).toMatchObject({
      utms: { utm_source: "direct" },
      clickIds: {},
    });
  });

  it("treats malformed storage as absent", () => {
    localStorage.setItem("tbh_attribution", "not-json");

    expect(getStoredAttribution()).toBeNull();
    expect(captureAttributionNow()).not.toBeNull();
  });
});
