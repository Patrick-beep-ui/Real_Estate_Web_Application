/// <reference types="jest" />

import { sendAttributionBeacon } from "@/lib/tracking/attribution-beacon";
import { captureAttributionNow } from "@/lib/tracking/traffic-source";

global.fetch = jest.fn();

const setUrl = (search = "") => {
  window.history.replaceState({}, "", `/${search}`);
};

describe("attribution-beacon", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
    localStorage.removeItem("tbh_attribution");
    setUrl();
  });

  afterEach(() => {
    localStorage.removeItem("tbh_attribution");
    setUrl();
  });

  it("POSTs a call beacon with channel, target phone, and attribution", () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    setUrl("?gclid=gclid-1&utm_source=google");
    captureAttributionNow();

    sendAttributionBeacon("call", "18664073411");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("/api/attribution/click");
    expect(init.method).toBe("POST");
    expect(init.keepalive).toBe(true);

    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      channel: "call",
      target_phone: "18664073411",
      gclid: "gclid-1",
      utm_source: "google",
    });
  });

  it("POSTs an SMS beacon without a target phone", () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    sendAttributionBeacon("sms");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.channel).toBe("sms");
  });

  it("does not throw when the fetch rejects", () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("network down"));

    expect(() => sendAttributionBeacon("call", "18664073411")).not.toThrow();
  });
});