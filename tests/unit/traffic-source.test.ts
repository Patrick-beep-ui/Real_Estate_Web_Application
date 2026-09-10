/// <reference types="jest" />

import { getClickIds, getTrafficSourceLabel } from "@/lib/tracking/traffic-source";

function setUrl(search = "") {
  window.history.replaceState({}, "", `/${search}`);
}

describe("traffic-source click IDs", () => {
  beforeEach(() => {
    setUrl();
    document.cookie = "_gcl_aw=; Max-Age=0; path=/";
    document.cookie = "_gcl_gb=; Max-Age=0; path=/";
  });

  afterEach(() => setUrl());

  it("keeps Google click ID types separate", () => {
    setUrl("?gclid=gclid-1&gbraid=gbraid-1&wbraid=wbraid-1");

    expect(getClickIds()).toMatchObject({
      gclid: "gclid-1",
      gbraid: "gbraid-1",
      wbraid: "wbraid-1",
    });
  });

  it("uses Conversion Linker cookies only as the matching ID fallback", () => {
    document.cookie = "_gcl_aw=GCL.1720000000.cookie-gclid; path=/";
    document.cookie = "_gcl_gb=GCL.1720000000.cookie-gbraid; path=/";

    expect(getClickIds()).toMatchObject({
      gclid: "cookie-gclid",
      gbraid: "cookie-gbraid",
      wbraid: null,
    });
  });

  it("prefers URL values over Conversion Linker cookies", () => {
    setUrl("?gclid=url-gclid&gbraid=url-gbraid");
    document.cookie = "_gcl_aw=GCL.1720000000.cookie-gclid; path=/";
    document.cookie = "_gcl_gb=GCL.1720000000.cookie-gbraid; path=/";

    expect(getClickIds()).toMatchObject({
      gclid: "url-gclid",
      gbraid: "url-gbraid",
    });
  });

  it("classifies every Google click ID type as Google Ads", () => {
    expect(getTrafficSourceLabel({ gclid: "gclid-1" })).toBe("Google Ads");
    expect(getTrafficSourceLabel({ gbraid: "gbraid-1" })).toBe("Google Ads");
    expect(getTrafficSourceLabel({ wbraid: "wbraid-1" })).toBe("Google Ads");
  });
});
