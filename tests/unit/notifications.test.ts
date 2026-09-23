/// <reference types="jest" />

import { notifyAttributionClickCaptured, notifyLeadCaptured } from "@/lib/leads/notifications";
import type { LeadData } from "@/lib/leads/types";
import { SLACK_WEBHOOK_URL_SUCCESS } from "@/lib/shared/env";

const notifySlackMock = jest.fn();
jest.mock("@/lib/notify", () => ({
  notifySlack: (...args: unknown[]) => notifySlackMock(...args),
}));

function baseLead(): LeadData {
  return {
    name: "Test User",
    phone: "+11234567890",
    market_slug: "tampa",
    situation_slug: "divorce",
    source: "website",
  };
}

function lastMessage(): string {
  expect(notifySlackMock).toHaveBeenCalled();
  return notifySlackMock.mock.calls[notifySlackMock.mock.calls.length - 1][0] as string;
}

describe("notifications.ts - timezone in Slack alerts", () => {
  beforeEach(() => {
    notifySlackMock.mockReset();
    notifySlackMock.mockResolvedValue(undefined);
  });

  it("includes browser timezone value only (no source suffix)", async () => {
    await notifyLeadCaptured({ ...baseLead(), tz_browser: "America/New_York" }, "Organic", "Synced");
    const msg = lastMessage();
    expect(msg).toContain("• Timezone: America/New_York");
    expect(msg).not.toContain("(browser)");
    expect(msg).not.toContain("(ip)");
  });

  it("falls back to ip timezone when browser is absent", async () => {
    await notifyLeadCaptured({ ...baseLead(), tz_browser: null, tz_ip: "Europe/Madrid" }, "Organic", "Synced");
    expect(lastMessage()).toContain("• Timezone: Europe/Madrid");
  });

  it("prefers browser timezone over ip timezone", async () => {
    await notifyLeadCaptured(
      { ...baseLead(), tz_browser: "America/Chicago", tz_ip: "America/New_York" },
      "Organic",
      "Synced"
    );
    expect(lastMessage()).toContain("• Timezone: America/Chicago");
  });

  it("shows a dash when no timezone is available", async () => {
    await notifyLeadCaptured({ ...baseLead(), tz_browser: null, tz_ip: null }, "Organic", "Synced");
    expect(lastMessage()).toContain("• Timezone: —");
  });
});

describe("notifications.ts - attribution click Slack alerts", () => {
  beforeEach(() => {
    notifySlackMock.mockReset();
    notifySlackMock.mockResolvedValue(undefined);
  });

  it.each([
    {
      channel: "call" as const,
      clickIdLabel: "gclid",
      clickIdValue: "google-click",
      trafficSource: "Google Ads",
      title: "📞 *Phone Attribution Click Captured*",
    },
    {
      channel: "sms" as const,
      clickIdLabel: "fbclid",
      clickIdValue: "meta-click",
      trafficSource: "Meta Ads",
      title: "💬 *SMS Attribution Click Captured*",
    },
  ])("formats a $channel alert through the success webhook", async ({ channel, clickIdLabel, clickIdValue, trafficSource, title }) => {
    await notifyAttributionClickCaptured(
      {
        channel,
        target_phone: "18664073411",
        fbc: null,
        fbp: null,
        fbclid: channel === "sms" ? clickIdValue : null,
        fb_adset_id: null,
        fb_campaign_id: null,
        gclid: channel === "call" ? clickIdValue : null,
        msclkid: null,
        utm_source: channel === "call" ? "google" : "facebook",
        utm_medium: null,
        utm_campaign: null,
        utm_content: null,
        utm_term: null,
        utm_id: null,
        page_path: null,
      },
      trafficSource
    );

    expect(notifySlackMock).toHaveBeenCalledWith(expect.stringContaining(title), SLACK_WEBHOOK_URL_SUCCESS);
    const message = lastMessage();
    expect(message).toContain(`• ${clickIdLabel}: ${clickIdValue}`);
    expect(message).toContain("• Page: -");
    expect(message).not.toContain("null");
  });
});
