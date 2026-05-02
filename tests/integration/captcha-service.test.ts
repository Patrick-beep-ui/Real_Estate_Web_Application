/// <reference types="jest" />

import { getRecaptchaToken, verifyRecaptchaToken } from "@/lib/recaptcha";

const hasEnvVars = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && process.env.RECAPTCHA_SECRET_KEY;

// Skip integration tests in CI (no real tokens available)
const runIntegration = false;

(runIntegration ? describe : describe.skip)("reCAPTCHA Integration Tests (Real Env Vars)", () => {
  it("should generate token when env vars are configured correctly", async () => {
    const token = await getRecaptchaToken("test_action");

    if (!token) {
      throw new Error("Token not generated - check NEXT_PUBLIC_RECAPTCHA_SITE_KEY in .env");
    }

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token!.length).toBeGreaterThan(0);
  });

  it("should fail verification on localhost (unauthorized domain)", async () => {
    const token = await getRecaptchaToken("test_action");

    if (!token) {
      console.warn("Skipping verification test: No token (env vars wrong)");
      return;
    }

    // On localhost, Google rejects the token because domain is not authorized
    const result = await verifyRecaptchaToken(token, process.env.RECAPTCHA_SECRET_KEY!);

    expect(result.success).toBe(false);
    console.log("✓ Confirmed: localhost domain causes verification failure (expected)");
  });
});
