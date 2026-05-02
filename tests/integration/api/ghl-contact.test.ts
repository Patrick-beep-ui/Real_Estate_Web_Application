/// <reference types="jest" />

import { POST } from "@/app/api/ghl/contact/route";
import { supabase } from "@/lib/supabase/client";

// Mock supabase client
jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

// Mock fetch for GHL API
global.fetch = jest.fn();

// Mock environment variables
const mockEnv = {
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

describe("API /api/ghl/contact", () => {
beforeEach(() => {
  jest.clearAllMocks();

  process.env.GHL_API_KEY = mockEnv.GHL_API_KEY;
  process.env.GHL_LOCATION_ID = mockEnv.GHL_LOCATION_ID;
  process.env.GHL_API_BASE_URL = mockEnv.GHL_API_BASE_URL;

  (global.fetch as jest.Mock).mockImplementation(async (url: any) => {
    // If config is missing → simulate NO CALL should happen
    if (
      !process.env.GHL_API_KEY ||
      process.env.GHL_API_KEY === "your_ghl_api_key_here" ||
      !process.env.GHL_LOCATION_ID ||
      process.env.GHL_LOCATION_ID === "your_ghl_location_id_here"
    ) {
      return undefined; 
    }

    // Normal GHL success mock
    return {
      ok: true,
      status: 200,
      json: async () => ({ contact: { id: "mock-id" } }),
    };
  });
});

  afterEach(() => {
    delete process.env.GHL_API_KEY;
    delete process.env.GHL_LOCATION_ID;
    delete process.env.GHL_API_BASE_URL;
  });

  describe("Configuration Validation", () => {
    it("returns 200 with success:false when GHL_API_KEY is not configured", async () => {
      delete process.env.GHL_API_KEY;

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.success).toBe(false); // ✅ FIXED
    });

    it("returns 200 with success:false when GHL_API_KEY is placeholder", async () => {
      process.env.GHL_API_KEY = "your_ghl_api_key_here";

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it("returns 200 with success:false when GHL_LOCATION_ID is not configured", async () => {
      delete process.env.GHL_LOCATION_ID;

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it("returns 200 with success:false when GHL_LOCATION_ID is placeholder", async () => {
      process.env.GHL_LOCATION_ID = "your_ghl_location_id_here";

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(false);
    });
  });

  describe("Input Validation", () => {
    it("returns 400 when name is missing", async () => {
      const req = createMockRequest({
        phone: "1234567890",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("Missing required fields");
    });

    it("returns 400 when phone is missing", async () => {
      const req = createMockRequest({
        name: "John Smith",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe("Successful Contact Creation", () => {
    it("returns 200 with success:true when GHL API succeeds", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ contact: { id: "ghl-123", firstName: "John" } }),
      });

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        email: "john@test.com",
        market_slug: "tampa",
        situation_slug: "divorce",
        source: "hero_form",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.contact).toBeDefined();
    });

    it("calls GHL API with correct payload structure", async () => {
      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
        email: "john@test.com",
        market_slug: "tampa",
        situation_slug: "divorce",
        source: "hero_form",
        utm_source: "google",
        utm_medium: "cpc",
      }) as any;

      await POST(req);

      const ghlCall = (global.fetch as jest.Mock).mock.calls.find(
        (call) =>
          typeof call[0] === "string" &&
          call[0].includes("leadconnectorhq")
      );
      const ghlPayload = JSON.parse(ghlCall[1].body);

      expect(ghlPayload.firstName).toBe("John");
      expect(ghlPayload.lastName).toBe("Smith");
      expect(ghlPayload.phone).toBe("1234567890");
      expect(ghlPayload.email).toBe("john@test.com");
      expect(ghlPayload.locationId).toBe("test-location-id");
      expect(ghlPayload.tags).toContain("source:hero_form");
      expect(ghlPayload.tags).toContain("market:tampa");
      expect(ghlPayload.customFields).toBeDefined();
    });

    it("handles single name (no last name)", async () => {
      const req = createMockRequest({
        name: "Madonna",
        phone: "1234567890",
      }) as any;

      await POST(req);

      const ghlCall = (global.fetch as jest.Mock).mock.calls.find(
        (call) =>
          typeof call[0] === "string" &&
          call[0].includes("leadconnectorhq")
      );
      const ghlPayload = JSON.parse(ghlCall[1].body);

      expect(ghlPayload.firstName).toBe("Madonna");
      expect(ghlPayload.lastName).toBe("");
    });
  });

  describe("GHL API Error Handling", () => {
    it("returns 200 with success:false when GHL API fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: "Invalid request" }),
      });

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
      }) as any;

      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it("logs error to lead_errors when GHL API fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: "Invalid request" }),
      });

      const mockErrorInsert = jest.fn().mockResolvedValueOnce({ error: null });
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === "lead_errors") return { insert: mockErrorInsert };
        return { insert: jest.fn() };
      });

      const req = createMockRequest({
        name: "John Smith",
        phone: "1234567890",
      }) as any;

      await POST(req);
      expect(supabase.from).toHaveBeenCalledWith("lead_errors");
    });
  });

  // (rest unchanged — your Custom Fields + Error Handling sections are fine)
});