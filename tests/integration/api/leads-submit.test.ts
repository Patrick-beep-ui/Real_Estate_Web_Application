/// <reference types="jest" />

import { POST } from "@/app/api/leads/submit/route";
import { supabase } from "@/lib/supabase/client";

// Mock supabase client
jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

// Mock fetch for reCAPTCHA verification and GHL
global.fetch = jest.fn();

// Mock environment variables
const mockEnv = {
  RECAPTCHA_SECRET_KEY: "test-secret-key",
  GHL_API_KEY: "test-ghl-key",
  GHL_LOCATION_ID: "test-location-id",
  GHL_API_BASE_URL: "https://services.leadconnectorhq.com",
};

// Helper to create a mock request object (simulates NextRequest)
const createMockRequest = (body: any) => ({
  json: async () => body,
  method: "POST",
  headers: { "Content-Type": "application/json" },
});

describe("API /api/leads/submit", () => {
beforeEach(() => {
  jest.clearAllMocks();

  process.env.RECAPTCHA_SECRET_KEY = mockEnv.RECAPTCHA_SECRET_KEY;
  process.env.GHL_API_KEY = mockEnv.GHL_API_KEY;
  process.env.GHL_LOCATION_ID = mockEnv.GHL_LOCATION_ID;
  process.env.GHL_API_BASE_URL = mockEnv.GHL_API_BASE_URL;

  // Default fetch mock (handles BOTH recaptcha + GHL)
  (global.fetch as jest.Mock).mockImplementation(async (url: any) => {
    if (typeof url === "string" && url.includes("recaptcha")) {
      return {
        ok: true,
        json: async () => ({ success: true, score: 0.9 }),
      };
    }

    // Default GHL mock
    return {
      ok: true,
      json: async () => ({ contact: { id: "mock-id" } }),
    };
  });
});

  afterEach(() => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    delete process.env.GHL_API_KEY;
    delete process.env.GHL_LOCATION_ID;
    delete process.env.GHL_API_BASE_URL;
  });

  describe("Input Validation", () => {
    it("returns 400 when name is missing", async () => {
      const req = createMockRequest({
        phone: "1234567890",
        recaptchaToken: "valid-token",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("Missing required fields");
    });

    it("returns 400 when phone is missing", async () => {
      const req = createMockRequest({
        name: "John Smith",
        recaptchaToken: "valid-token",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 when recaptchaToken is missing", async () => {
      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("reCAPTCHA token");
    });
  });

  describe("reCAPTCHA Verification", () => {
    it("returns 400 when reCAPTCHA verification fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: false, "error-codes": ["invalid-input-response"] }),
      });

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        recaptchaToken: "invalid-token",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("reCAPTCHA verification failed");
    });

    it("returns 400 when reCAPTCHA score is below threshold", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, score: 0.3 }),
      });

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        recaptchaToken: "low-score-token",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("succeeds when reCAPTCHA score meets threshold", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, score: 0.9 }),
      });

      const mockInsert = jest.fn().mockResolvedValueOnce({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        recaptchaToken: "valid-token",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(200);
    });
  });

  describe("Database Operations", () => {
    beforeEach(() => {
      // Mock successful reCAPTCHA
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, score: 0.9 }),
      });
    });

    it("returns 500 when database insert fails", async () => {
      const mockInsert = jest.fn().mockResolvedValueOnce({
        error: { code: "23505", message: "Unique violation", details: "Key already exists" },
      });
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === "leads") return { insert: mockInsert };
        if (table === "lead_errors") return { insert: jest.fn().mockResolvedValue({ error: null }) };
        return { insert: jest.fn() };
      });

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        recaptchaToken: "valid-token",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toContain("Failed to save lead");
    });

    it("logs error to lead_errors when DB insert fails", async () => {
      const mockInsert = jest.fn().mockResolvedValueOnce({
        error: { code: "23505", message: "Unique violation", details: "Key already exists" },
      });
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === "leads") return { insert: mockInsert };
        if (table === "lead_errors") return { insert: jest.fn().mockResolvedValue({ error: null }) };
        return { insert: jest.fn() };
      });

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        recaptchaToken: "valid-token",
      }) as any;

      await POST(req);
      expect(supabase.from).toHaveBeenCalledWith("lead_errors");
    });

    it("returns 200 with success when all operations succeed", async () => {
      const mockInsert = jest.fn().mockResolvedValueOnce({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        email: "john@test.com",
        market_slug: "tampa",
        situation_slug: "divorce",
        source: "hero_form",
        recaptchaToken: "valid-token",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it("only includes known columns in insert payload, strips unknown fields", async () => {
      const mockInsert = jest.fn().mockResolvedValueOnce({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        email: "john@test.com",
        market_slug: "tampa",
        situation_slug: "divorce",
        source: "hero_form",
        utm_source: "google",
        utm_medium: "cpc",
        utm_campaign: "spring_sale",
        utm_content: "hero_button",
        utm_term: "buy+house",
        some_unknown_field: "should be stripped",
        recaptchaToken: "valid-token",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(200);

      const actualPayload = mockInsert.mock.calls[0][0];
      expect(actualPayload.utm_content).toBe("hero_button");
      expect(actualPayload.utm_term).toBe("buy+house");
      expect(actualPayload).not.toHaveProperty("some_unknown_field");
      expect(actualPayload.utm_source).toBe("google");
      expect(actualPayload.utm_medium).toBe("cpc");
      expect(actualPayload.utm_campaign).toBe("spring_sale");
    });
  });

  describe("GHL Integration", () => {
    beforeEach(() => {
      // Mock successful reCAPTCHA
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, score: 0.9 }),
      });

      // Mock successful DB insert
      const mockInsert = jest.fn().mockResolvedValueOnce({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });
    });

    it("skips GHL when API key is not configured", async () => {
      delete process.env.GHL_API_KEY;

      jest.resetModules();

      const { POST: FreshPOST } = await import("@/app/api/leads/submit/route");

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        recaptchaToken: "valid-token",
      }) as any;

       const res = await FreshPOST(req);
      expect(res.status).toBe(200);

      // Verify no GHL API call was made (only reCAPTCHA + DB)
      const ghlCalls = (global.fetch as jest.Mock).mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes("leadconnectorhq")
      );
      expect(ghlCalls.length).toBe(0);
    });

    it("skips GHL when location ID is not configured", async () => {
      delete process.env.GHL_LOCATION_ID;

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        recaptchaToken: "valid-token",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it("calls GHL API when configured", async () => {
      // Mock GHL API response
      (global.fetch as jest.Mock).mockImplementation(async (url) => {
        if (typeof url === 'string' && url.includes("recaptcha")) {
          return {
            json: async () => ({ success: true, score: 0.9 }),
          };
        }
        // GHL call
        return {
          ok: true,
          json: async () => ({ contact: { id: "ghl-123" } }),
        };
      });

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        recaptchaToken: "valid-token",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(200);

      // Verify GHL was called
      const ghlCalls = (global.fetch as jest.Mock).mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes("leadconnectorhq")
      );
      expect(ghlCalls.length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("returns 500 on unexpected error", async () => {
      const req = {
        json: jest.fn().mockRejectedValueOnce(new Error("Invalid JSON")),
      } as any;

      const res = await POST(req);
      expect(res.status).toBe(500);
    });
  });
});
