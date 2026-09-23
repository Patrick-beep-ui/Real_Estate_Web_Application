/// <reference types="jest" />

import { readThankYouContext, writeThankYouContext } from "@/lib/tracking/thank-you-context";

const STORAGE_KEY = "tbh_thank_you_context";

describe("thank-you context", () => {
  beforeEach(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-09-23T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
    sessionStorage.removeItem(STORAGE_KEY);
  });

  it("overwrites prior context and returns the latest successful form source", () => {
    writeThankYouContext({ originPagePath: "/divorce/tampa", leadSource: "hero_form" });
    writeThankYouContext({ originPagePath: "/job-loss/mesa", leadSource: "exit_intent" });

    expect(readThankYouContext()).toEqual({
      originPagePath: "/job-loss/mesa",
      leadSource: "exit_intent",
    });
  });

  it("removes context after ten minutes", () => {
    writeThankYouContext({ originPagePath: "/divorce/tampa", leadSource: "hero_form" });
    jest.advanceTimersByTime(10 * 60 * 1000 + 1);

    expect(readThankYouContext()).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("removes malformed context", () => {
    sessionStorage.setItem(STORAGE_KEY, "not-json");

    expect(readThankYouContext()).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
