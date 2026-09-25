/// <reference types="jest" />

import { trackLeadSubmission } from "@/lib/tracking/analytics";

const hasAnalyticsConsentMock = jest.fn();

jest.mock("@/components/widgets/CookieConsent", () => ({
  hasAnalyticsConsent: () => hasAnalyticsConsentMock(),
}));

type WindowWithPixel = Window & { fbq?: jest.Mock; gtag?: jest.Mock };

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

  it("does not send a Lead event without analytics consent", () => {
    hasAnalyticsConsentMock.mockReturnValue(false);

    trackLeadSubmission({
      market: "tampa",
      situation: "divorce",
      source: "hero_form",
      eventId: "event-123",
      email: "jane@example.com",
      phone: "+18135551234",
      firstName: "Jane",
    });

    expect(browserWindow.fbq).not.toHaveBeenCalled();
  });
});
