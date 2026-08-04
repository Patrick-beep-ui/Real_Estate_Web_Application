"use client";

export interface RecaptchaResult {
  success: boolean;
  score?: number;
  errorCodes?: string[];
}

/**
 * Generate a reCAPTCHA token for the given action
 * Returns undefined if site key is missing or grecaptcha is not available
 */
export async function getRecaptchaToken(action: string): Promise<string | undefined> {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey || typeof window === "undefined" || !window.grecaptcha) return undefined;
  return new Promise((resolve) => {
    window.grecaptcha.ready(async () => {
      try {
        const token = await window.grecaptcha.execute(siteKey, { action });
        resolve(token);
      } catch {
        resolve(undefined);
      }
    });
  });
}

/**
 * Verify a reCAPTCHA token server-side
 * Returns the verification result from Google's API
 */
export async function verifyRecaptchaToken(
  token: string,
  secretKey: string
): Promise<RecaptchaResult> {
  const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: secretKey,
      response: token,
    }),
  });
  return verifyRes.json();
}
