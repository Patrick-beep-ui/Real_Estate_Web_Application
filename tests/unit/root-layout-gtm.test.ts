/// <reference types="jest" />

import { readFileSync } from "node:fs";
import { join } from "node:path";

const layoutSource = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
const serviceLocationClientSource = readFileSync(join(process.cwd(), "src/app/[situation]/[market]/ServiceLocationClient.tsx"), "utf8");
const californiaPageSource = readFileSync(join(process.cwd(), "src/app/landing/california/page.tsx"), "utf8");

describe("RootLayout Google Tag Manager", () => {
  it("includes the GTM container script and noscript fallback", () => {
    expect(layoutSource).toContain("GTM-NNR4C4F7");
    expect(layoutSource).toContain("https://www.googletagmanager.com/gtm.js");
    expect(layoutSource).toContain("https://www.googletagmanager.com/ns.html?id=");
  });
});

describe("RootLayout global tracking (consent, init, attribution)", () => {
  it("renders the global cookie banner, analytics init, and attribution capture", () => {
    expect(layoutSource).toContain("import CookieConsent");
    expect(layoutSource).toContain("import AnalyticsInit");
    expect(layoutSource).toContain("import AttributionCapture");
    expect(layoutSource).toContain("<AttributionCapture />");
    expect(layoutSource).toContain("<AnalyticsInit />");
    expect(layoutSource).toContain("<CookieConsent />");
  });

  it("removes per-page cookie banner instances", () => {
    expect(serviceLocationClientSource).not.toContain("CookieConsent");
    expect(californiaPageSource).not.toContain("CookieConsent");
  });

  it("removes the per-page analytics init from the california landing page", () => {
    expect(californiaPageSource).not.toContain("LandingAnalyticsInit");
  });
});