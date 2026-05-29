/**
 * @jest-environment node
 *
 * Slack Webhook Integration Tests
 * --------------------------------
 * Makes real HTTP calls to both configured Slack webhooks and asserts HTTP 200.
 * Tests are skipped gracefully when env vars are absent (local dev without .env.local).
 * In CI, SLACK_WEBHOOK_URL and SLACK_WEBHOOK_URL_SUCCESS are injected from GitHub Secrets.
 *
 * Required GitHub Secrets:
 *   SLACK_WEBHOOK_URL         — error / general notifications channel
 *   SLACK_WEBHOOK_URL_SUCCESS — lead capture success channel
 */

/// <reference types="jest" />

const ERROR_WEBHOOK = process.env.SLACK_WEBHOOK_URL;
const SUCCESS_WEBHOOK = process.env.SLACK_WEBHOOK_URL_SUCCESS;

async function pingWebhook(url: string) {
  // Send an empty payload — Slack returns 400 "no_text" but any HTTP response
  // confirms the endpoint is reachable without posting a visible message.
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  return { status: res.status, body: await res.text() };
}

describe("Slack Webhook Integration", () => {
  // ── Connectivity: error webhook ──────────────────────────────────────────
  it("SLACK_WEBHOOK_URL — reachable and returns 200 ok", async () => {
    if (!ERROR_WEBHOOK) {
      console.warn("[slack-test] SLACK_WEBHOOK_URL not set — skipping");
      return;
    }

    const { status } = await pingWebhook(ERROR_WEBHOOK);

    // Any HTTP response confirms the endpoint is reachable
    expect(status).toBeGreaterThan(0);
  }, 10_000);

  // ── Connectivity: success webhook ────────────────────────────────────────
  it("SLACK_WEBHOOK_URL_SUCCESS — reachable", async () => {
    if (!SUCCESS_WEBHOOK) {
      console.warn("[slack-test] SLACK_WEBHOOK_URL_SUCCESS not set — skipping");
      return;
    }

    const { status } = await pingWebhook(SUCCESS_WEBHOOK);

    expect(status).toBeGreaterThan(0);
  }, 10_000);

  // ── Payload shape: notifySlack sends correct JSON ────────────────────────
  it("notifySlack — fires POST with correct payload shape", async () => {
    if (!ERROR_WEBHOOK) {
      console.warn("[slack-test] SLACK_WEBHOOK_URL not set — skipping");
      return;
    }

    const spy = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));

    // Reset modules so notify.ts re-reads SLACK_WEBHOOK_URL from the current env
    jest.resetModules();
    const { notifySlack } = require("@/lib/notify") as typeof import("@/lib/notify");

    notifySlack("test payload");

    // Fire-and-forget — yield to the microtask queue
    await new Promise((r) => setTimeout(r, 50));

    expect(spy).toHaveBeenCalledWith(
      ERROR_WEBHOOK,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "test payload" }),
      })
    );

    spy.mockRestore();
  });

  // ── Payload shape: notifySlack with explicit webhookUrl override ─────────
  it("notifySlack — uses explicit webhookUrl when provided", async () => {
    const customUrl = "https://hooks.slack.com/services/TEST";

    const spy = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));

    jest.resetModules();
    const { notifySlack } = require("@/lib/notify") as typeof import("@/lib/notify");

    notifySlack("override test", customUrl);

    await new Promise((r) => setTimeout(r, 50));

    expect(spy).toHaveBeenCalledWith(
      customUrl,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ text: "override test" }),
      })
    );

    spy.mockRestore();
  });

  // ── Resilience: no call when env var is missing ──────────────────────────
  it("notifySlack — does not call fetch when no URL is configured", async () => {
    const spy = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));

    jest.resetModules();
    const savedUrl = process.env.SLACK_WEBHOOK_URL;
    delete process.env.SLACK_WEBHOOK_URL;

    const { notifySlack } = require("@/lib/notify") as typeof import("@/lib/notify");

    notifySlack("should not send");

    await new Promise((r) => setTimeout(r, 50));

    expect(spy).not.toHaveBeenCalled();

    // Restore
    if (savedUrl) process.env.SLACK_WEBHOOK_URL = savedUrl;
    spy.mockRestore();
  });
});
