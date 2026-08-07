/// <reference types="jest" />

import { notifyLeadCaptured } from "@/lib/leads/notifications";
import type { LeadData } from "@/lib/leads/types";

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
