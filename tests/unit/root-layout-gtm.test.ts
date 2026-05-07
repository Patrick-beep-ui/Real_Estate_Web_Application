/// <reference types="jest" />

import { readFileSync } from "node:fs";
import { join } from "node:path";

const layoutSource = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");

describe("RootLayout Google Tag Manager", () => {
  it("includes the GTM container script and noscript fallback", () => {
    expect(layoutSource).toContain("GTM-NNR4C4F7");
    expect(layoutSource).toContain("https://www.googletagmanager.com/gtm.js");
    expect(layoutSource).toContain("https://www.googletagmanager.com/ns.html?id=");
  });
});
