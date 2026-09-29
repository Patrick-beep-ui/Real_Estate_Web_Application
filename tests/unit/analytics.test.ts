/// <reference types="jest" />

import { trackLeadSubmission } from "@/lib/tracking/analytics";

const hasAnalyticsConsentMock = jest.fn();

jest.mock("@/components/widgets/CookieConsent", () => ({
  hasAnalyticsConsent: () => hasAnalyticsConsentMock(),
}));

type WindowWithPixel = Window & { fbq?: jest.Mock; gtag?: jest.Mock };

/** Loads a fresh analytics module instance with the given Google identifiers. */
const loadAnalytics = async (env: { ga4?: string; adsId?: string; adsLabel?: string }) => {
  const previous = { ...process.env };
  process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID = env.ga4 ?? "";
  process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID = env.adsId ?? "";
  process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL = env.adsLabel ?? "";

  let mod!: typeof import("@/lib/tracking/analytics");
  await jest.isolateModulesAsync(async () => {
    mod = await import("@/lib/tracking/analytics");
  });

  process.env = previous;
  return mod;
};

const lead = {
  market: "tampa",
  situation: "divorce",
  source: "hero_form",
  eventId: "event-123",
  email: "jane@example.com",
  phone: "+18135551234",
  firstName: "Jane",
};

describe("trackLeadSubmission advanced matching", () => {
  const browserWindow = window as WindowWithPixel;

  beforeEach(() => {
    hasAnalyticsConsentMock.mockReturnValue(true);
    browserWindow.fbq = jest.fn();
    delete browserWindow.gtag;
  });

  afterEach(() => {
    delete browserWindow.fbq;
    delete browserWindow.gtag;
  });

  it("sends normalized advanced matching data alongside the shared event ID", () => {
    trackLeadSubmission({
      market: "tampa",
      situation: "divorce",
      source: "hero_form",
      eventId: "event-123",
      email: " Jane@Example.com ",
      phone: "+1 (813) 555-1234",
      firstName: " Jane ",
    });

    expect(browserWindow.fbq).toHaveBeenCalledWith(
      "track",
      "Lead",
      {
        content_name: "tampa_divorce",
        content_category: "hero_form",
        value: 0,
        currency: "USD",
      },
      {
        eventID: "event-123",
        user_data: {
          em: "jane@example.com",
          ph: "18135551234",
          fn: "jane",
        },
      }
    );
  });

  it("omits empty advanced matching data while retaining the event ID", () => {
    trackLeadSubmission({
      market: "tampa",
      situation: "divorce",
      source: "hero_form",
      eventId: "event-123",
      email: " ",
      phone: "",
      firstName: null,
    });

    expect(browserWindow.fbq).toHaveBeenLastCalledWith(
      "track",
      "Lead",
      expect.any(Object),
      { eventID: "event-123" }
    );
  });
});

describe("site analytics preference separates GA4 from advertising", () => {
  const browserWindow = window as WindowWithPixel;

  beforeEach(() => {
    hasAnalyticsConsentMock.mockReturnValue(false);
    browserWindow.fbq = jest.fn();
    browserWindow.gtag = jest.fn();
  });

  afterEach(() => {
    delete browserWindow.fbq;
    delete browserWindow.gtag;
  });

  it("configures Google Ads without GA4, then adds GA4 once analytics are allowed", async () => {
    const analytics = await loadAnalytics({ ga4: "G-TEST", adsId: "AW-TEST", adsLabel: "lead" });
    hasAnalyticsConsentMock.mockReturnValue(false);
    browserWindow.gtag = jest.fn();

    analytics.initAnalytics();

    expect(browserWindow.gtag).toHaveBeenCalledWith("js", expect.anything());
    expect(browserWindow.gtag).toHaveBeenCalledWith("config", "AW-TEST");
    expect(browserWindow.gtag).not.toHaveBeenCalledWith("config", "G-TEST", expect.anything());

    hasAnalyticsConsentMock.mockReturnValue(true);
    analytics.initAnalytics();

    expect(browserWindow.gtag).toHaveBeenCalledWith(
      "config",
      "G-TEST",
      expect.objectContaining({ send_page_view: true })
    );
    expect(browserWindow.gtag!.mock.calls.filter((call) => call[0] === "config" && call[1] === "AW-TEST")).toHaveLength(1);
    expect(browserWindow.gtag!.mock.calls.filter((call) => call[1] === "G-TEST")).toHaveLength(1);
  });

  it("fires the Ads conversion and Meta Lead but not GA4 when analytics are not allowed", async () => {
    const analytics = await loadAnalytics({ ga4: "G-TEST", adsId: "AW-TEST", adsLabel: "lead" });
    hasAnalyticsConsentMock.mockReturnValue(false);

    analytics.trackLeadSubmission(lead);

    expect(browserWindow.gtag).not.toHaveBeenCalledWith("event", "generate_lead", expect.anything());
    expect(browserWindow.gtag).toHaveBeenCalledWith(
      "event",
      "conversion",
      expect.objectContaining({ send_to: "AW-TEST/lead" })
    );
    expect(browserWindow.fbq).toHaveBeenCalledWith(
      "track",
      "Lead",
      expect.any(Object),
      expect.objectContaining({ eventID: "event-123" })
    );
  });

  it("fires the GA4 lead event when site analytics are allowed", async () => {
    const analytics = await loadAnalytics({ ga4: "G-TEST", adsId: "AW-TEST", adsLabel: "lead" });
    hasAnalyticsConsentMock.mockReturnValue(true);

    analytics.trackLeadSubmission(lead);

    expect(browserWindow.gtag).toHaveBeenCalledWith("event", "generate_lead", expect.objectContaining({ event_category: "lead" }));
  });

  it("fires the Meta custom event but skips GA4 when analytics are not allowed", async () => {
    const analytics = await loadAnalytics({ ga4: "G-TEST", adsId: "AW-TEST", adsLabel: "lead" });
    hasAnalyticsConsentMock.mockReturnValue(false);

    analytics.trackConversion("form_view", { source: "hero_form" });

    expect(browserWindow.gtag).not.toHaveBeenCalled();
    expect(browserWindow.fbq).toHaveBeenCalledWith("trackCustom", "form_view", { source: "hero_form" });
  });
});
