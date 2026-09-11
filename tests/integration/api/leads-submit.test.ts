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

    it("returns 200 with warning when DB fails but GHL succeeds", async () => {
      const mockInsert = jest.fn().mockResolvedValueOnce({
        error: { code: "PGRST204", message: "Column not found" },
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
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.warnings).toBeDefined();
      expect(body.warnings[0]).toContain("Database unavailable");
    });

    it("returns 500 when both DB and GHL fail", async () => {
      (global.fetch as jest.Mock).mockImplementation(async (url) => {
        if (typeof url === "string" && url.includes("recaptcha")) {
          return { ok: true, status: 200, json: async () => ({ success: true, score: 0.9 }) };
        }
        return { ok: false, status: 500, json: async () => ({ message: "GHL internal error" }) };
      });

      const mockInsert = jest.fn().mockResolvedValueOnce({
        error: { code: "PGRST204", message: "Column not found" },
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
        error: { code: "PGRST204", message: "Column not found" },
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

    it("blocks a shape-failing address from being stored (422, no insert, lead_errors)", async () => {
      const mockInsert = jest.fn().mockResolvedValueOnce({ error: null });
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === "leads") return { insert: mockInsert };
        if (table === "lead_errors") return { insert: jest.fn().mockResolvedValue({ error: null }) };
        return { insert: jest.fn() };
      });

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        property_address: "21031n",
        address_source: "manual_confirmed",
        recaptchaToken: "valid-token",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(["address_not_found", "address_unverifiable"]).toContain(body.error);
      expect(body.message.length).toBeGreaterThan(0);

      expect(mockInsert).not.toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith("lead_errors");
    });

    it("returns 200 with duplicate:true when same phone is submitted again (23505)", async () => {
      const mockInsert = jest.fn().mockResolvedValueOnce({
        error: { code: "23505", message: "duplicate key violates unique constraint" },
      });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        recaptchaToken: "valid-token",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.duplicate).toBe(true);
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

    it("persists and syncs Google click IDs as separate fields", async () => {
      const mockInsert = jest.fn().mockResolvedValueOnce({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        gclid: "gclid-1",
        gbraid: "gbraid-1",
        wbraid: "wbraid-1",
        recaptchaToken: "valid-token",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        gclid: "gclid-1",
        gbraid: "gbraid-1",
        wbraid: "wbraid-1",
      }));

      const ghlCall = (global.fetch as jest.Mock).mock.calls.find(
        (call) => typeof call[0] === "string" && call[0].includes("leadconnectorhq") && call[0].endsWith("/contacts")
      );
      const ghlPayload = JSON.parse(ghlCall[1].body);
      expect(ghlPayload.customFields).toEqual(expect.arrayContaining([
        { key: "google_gclid", value: "gclid-1" },
        { key: "gbraid", value: "gbraid-1" },
        { key: "wbraid", value: "wbraid-1" },
      ]));
    });
  });

  describe("Address Verification", () => {
    let geocodeMode: "OK" | "ZERO_RESULTS" | "ERROR" = "ZERO_RESULTS";
    let mockInsert: jest.Mock;
    let mockInsertLeadError: jest.Mock;

    beforeEach(() => {
      geocodeMode = "ZERO_RESULTS";
      mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockInsertLeadError = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === "leads") return { insert: mockInsert };
        if (table === "lead_errors") return { insert: mockInsertLeadError };
        return { insert: jest.fn().mockResolvedValue({ error: null }) };
      });

      (global.fetch as jest.Mock).mockImplementation(async (url: any) => {
        if (typeof url === "string" && url.includes("recaptcha")) {
          return { ok: true, status: 200, json: async () => ({ success: true, score: 0.9 }) };
        }
        if (typeof url === "string" && url.includes("maps.googleapis.com")) {
          if (geocodeMode === "ERROR") throw new Error("network down");
          return {
            ok: true,
            json: async () =>
              geocodeMode === "OK"
                ? { status: "OK", results: [{ formatted_address: "verified" }] }
                : { status: "ZERO_RESULTS", results: [] },
          };
        }
        if (typeof url === "string" && url.includes("leadconnectorhq")) {
          return { ok: true, json: async () => ({ contact: { id: "ghl-123" } }) };
        }
        return { ok: true, json: async () => ({}) };
      });
    });

    const countGhlCalls = () =>
      (global.fetch as jest.Mock).mock.calls.filter(
        (call) => typeof call[0] === "string" && call[0].includes("leadconnectorhq")
      );

    it("blocks an api_fallback garbage address when geocode has no match (422, descriptive message, no insert, no GHL)", async () => {
      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        property_address: "street, Tampa, FL 33612",
        address_source: "api_fallback",
        recaptchaToken: "valid-token",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toBe("address_not_found");
      expect(body.error_code).toBe("no_match");
      expect(body.message).toContain("street, Tampa, FL 33612");
      expect(body.message).toContain("Google Maps");
      expect(body.message).toContain("ZIP");

      expect(mockInsert).not.toHaveBeenCalled();
      expect(mockInsertLeadError).toHaveBeenCalled();
      expect(countGhlCalls()).toHaveLength(0);
    });

    it("rescues a shape-failed but real address via server geocode (verified, server_geocoded)", async () => {
      geocodeMode = "OK";

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        property_address: "1449 sandelin ave, San Leandro, CA",
        address_source: "manual_confirmed",
        recaptchaToken: "valid-token",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(200);

      const insertPayload = mockInsert.mock.calls[0][0];
      expect(insertPayload.address_verified).toBe(true);
      expect(insertPayload.address_source).toBe("manual_confirmed");

      expect(supabase.from).not.toHaveBeenCalledWith("lead_errors");
    });

    it("blocks a shape-valid address when geocode returns no match (422, address_not_found)", async () => {
      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        property_address: "123 Main St, Tampa, FL 33612",
        address_source: "manual_confirmed",
        recaptchaToken: "valid-token",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toBe("address_not_found");
      expect(body.error_code).toBe("no_match");

      expect(mockInsert).not.toHaveBeenCalled();
      expect(mockInsertLeadError).toHaveBeenCalled();
      expect(countGhlCalls()).toHaveLength(0);
    });

    it("blocks and alerts when the geocode dies for infrastructure reasons (422, address_unverifiable, no insert)", async () => {
      geocodeMode = "ERROR";

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        property_address: "456 Elm Ave, Denver, CO 80202",
        address_source: "manual_confirmed",
        recaptchaToken: "valid-token",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toBe("address_unverifiable");
      expect(body.error_code).toBe("network");
      expect(body.message.length).toBeGreaterThan(0);

      expect(mockInsert).not.toHaveBeenCalled();
      expect(mockInsertLeadError).toHaveBeenCalled();
      expect(countGhlCalls()).toHaveLength(0);
    });

    it("still syncs a verified lead to GHL", async () => {
      geocodeMode = "OK";

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        property_address: "789 Oak Dr, Austin, TX 78701",
        address_source: "server_geocoded",
        recaptchaToken: "valid-token",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(200);

      expect(countGhlCalls().length).toBeGreaterThan(0);
    });

    it("does not trust a forged google_selected source", async () => {
      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        property_address: "502 blah blah",
        address_source: "google_selected",
        recaptchaToken: "valid-token",
      }) as any;

      const res = await POST(req);

      expect(res.status).toBe(422);
      expect(mockInsert).not.toHaveBeenCalled();
      expect(mockInsertLeadError).toHaveBeenCalled();
      expect(countGhlCalls()).toHaveLength(0);
    });

    it("server-verifies a native-selected address before storing it", async () => {
      geocodeMode = "OK";

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        property_address: "999 Oak St, Tampa, FL 33612",
        address_source: "google_selected",
        recaptchaToken: "valid-token",
      }) as any;

      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockInsert.mock.calls[0][0]).toMatchObject({
        address_verified: true,
        address_source: "google_selected",
      });
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

  describe("Timezone Capture", () => {
    let mockInsert: jest.Mock;

    beforeEach(() => {
      mockInsert = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === "leads") return { insert: mockInsert };
        return { insert: jest.fn().mockResolvedValue({ error: null }) };
      });
      (global.fetch as jest.Mock).mockImplementation(async (url: any) => {
        if (typeof url === "string" && url.includes("recaptcha")) {
          return { ok: true, status: 200, json: async () => ({ success: true, score: 0.9 }) };
        }
        if (typeof url === "string" && url.includes("leadconnectorhq")) {
          return { ok: true, json: async () => ({ contact: { id: "ghl-123" } }) };
        }
        return { ok: true, json: async () => ({}) };
      });
    });

    const findGhlContactCall = () =>
      (global.fetch as jest.Mock).mock.calls.find(
        (call) => typeof call[0] === "string" && call[0].includes("leadconnectorhq") && call[0].endsWith("/contacts")
      );

    it("stores tz_browser and tz_ip in the DB insert payload", async () => {
      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        market_slug: "tampa",
        situation_slug: "divorce",
        source: "hero_form",
        tz_browser: "America/New_York",
        tz_ip: "America/Chicago",
        recaptchaToken: "valid-token",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(200);

      expect(mockInsert).toHaveBeenCalledTimes(1);
      const insertPayload = mockInsert.mock.calls[0][0];
      expect(insertPayload.tz_browser).toBe("America/New_York");
      expect(insertPayload.tz_ip).toBe("America/Chicago");
    });

    it("sends tz_browser as the GHL contact timezone (browser wins over ipinfo)", async () => {
      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        tz_browser: "America/New_York",
        tz_ip: "America/Chicago",
        recaptchaToken: "valid-token",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(200);

      const ghlCall = findGhlContactCall();
      expect(ghlCall).toBeDefined();
      const ghlBody = JSON.parse(ghlCall[1].body);
      expect(ghlBody.timezone).toBe("America/New_York");
    });

    it("falls back to tz_ip when tz_browser is absent", async () => {
      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        tz_ip: "America/Chicago",
        recaptchaToken: "valid-token",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(200);

      const ghlCall = findGhlContactCall();
      expect(ghlCall).toBeDefined();
      const ghlBody = JSON.parse(ghlCall[1].body);
      expect(ghlBody.timezone).toBe("America/Chicago");
    });

    it("omits GHL timezone for invalid IANA strings", async () => {
      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        tz_browser: "EST",
        recaptchaToken: "valid-token",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(200);

      const ghlCall = findGhlContactCall();
      expect(ghlCall).toBeDefined();
      const ghlBody = JSON.parse(ghlCall[1].body);
      expect(ghlBody).not.toHaveProperty("timezone");
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
