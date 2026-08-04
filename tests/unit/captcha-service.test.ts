/// <reference types="jest" />

import { getRecaptchaToken, verifyRecaptchaToken } from "@/lib/tracking/recaptcha";

// Mock window.grecaptcha
const mockGrecaptcha = {
  ready: jest.fn((cb) => cb()),
  execute: jest.fn().mockResolvedValue("fake-recaptcha-token"),
};


// Mock fetch for Google reCAPTCHA API
global.fetch = jest.fn();

describe("getRecaptchaToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "test-site-key";
    (window as any).grecaptcha = mockGrecaptcha;
  });

  it("should return undefined if site key is missing", async () => {
    delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    const token = await getRecaptchaToken("test_action");
    expect(token).toBeUndefined();
  });

  it("should return undefined if window.grecaptcha is not available", async () => {
    delete (window as any).grecaptcha;
    const token = await getRecaptchaToken("test_action");
    expect(token).toBeUndefined();
  });

  it("should return undefined if grecaptcha.execute throws", async () => {
    mockGrecaptcha.execute.mockRejectedValueOnce(new Error("grecaptcha error"));
    const token = await getRecaptchaToken("submit_lead");
    expect(token).toBeUndefined();
  });

  it("should generate token when grecaptcha and site key are available", async () => {
    const token = await getRecaptchaToken("submit_lead");
    expect(token).toBe("fake-recaptcha-token");
    expect(mockGrecaptcha.execute).toHaveBeenCalledWith("test-site-key", { action: "submit_lead" });
  });
});

describe("verifyRecaptchaToken", () => {
  const SECRET_KEY = "test-secret-key";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return success:false when Google returns failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: false, "error-codes": ["invalid-input-response"] }),
    });

    const result = await verifyRecaptchaToken("invalid-token", SECRET_KEY);
    expect(result.success).toBe(false);
    expect(result["error-codes"]).toContain("invalid-input-response");
  });

  it("should return success:true with score when Google returns success", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, score: 0.9 }),
    });

    const result = await verifyRecaptchaToken("valid-token", SECRET_KEY);
    expect(result.success).toBe(true);
    expect(result.score).toBe(0.9);
  });

  it("should call Google API with correct parameters", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, score: 0.9 }),
    });

    await verifyRecaptchaToken("valid-token", SECRET_KEY);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: expect.any(URLSearchParams),
      }
    );

    const body = (global.fetch as jest.Mock).mock.calls[0][1].body;
    expect(body.get("secret")).toBe(SECRET_KEY);
    expect(body.get("response")).toBe("valid-token");
  });

  it("should propagate fetch errors", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    await expect(verifyRecaptchaToken("valid-token", SECRET_KEY)).rejects.toThrow("Network error");
  });
});
