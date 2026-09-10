/// <reference types="jest" />

import { POST as autocomplete } from "@/app/api/places/autocomplete/route";
import { POST as details } from "@/app/api/places/details/route";
import { autocompletePlaces, getPlaceAddress } from "@/lib/leads/places";
import { rateLimit } from "@/lib/shared/rate-limit";

jest.mock("@/lib/leads/places", () => ({
  autocompletePlaces: jest.fn(),
  getPlaceAddress: jest.fn(),
  isValidPlacesSessionToken: jest.fn((value) => typeof value === "string" && value.length >= 16),
  isValidPlacesPlaceId: jest.fn((value) => typeof value === "string" && value.length >= 16),
}));

jest.mock("@/lib/shared/rate-limit", () => ({ rateLimit: jest.fn() }));

const sessionToken = "a".repeat(32);
const request = (body: unknown) => ({
  headers: new Headers({ "x-forwarded-for": "203.0.113.42" }),
  json: async () => body,
}) as any;

describe("Places proxy routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockResolvedValue({ success: true, remaining: 10, reset: Date.now() + 60_000 });
  });

  it("returns autocomplete suggestions from the server helper", async () => {
    (autocompletePlaces as jest.Mock).mockResolvedValue({
      ok: true,
      data: [{ placeId: "ChIJ1234567890abcdef", description: "123 Main St, Tampa, FL" }],
    });

    const response = await autocomplete(request({ input: "123 Main", sessionToken }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      suggestions: [{ placeId: "ChIJ1234567890abcdef", description: "123 Main St, Tampa, FL" }],
    });
    expect(autocompletePlaces).toHaveBeenCalledWith("123 Main", sessionToken);
  });

  it("does not call Google when autocomplete is rate limited", async () => {
    (rateLimit as jest.Mock).mockResolvedValue({ success: false, remaining: 0, reset: Date.now() + 60_000 });

    const response = await autocomplete(request({ input: "123 Main", sessionToken }));

    expect(response.status).toBe(429);
    expect(autocompletePlaces).not.toHaveBeenCalled();
  });

  it("rejects malformed proxy input", async () => {
    const response = await autocomplete(request({ input: "12", sessionToken: "bad" }));

    expect(response.status).toBe(400);
    expect(autocompletePlaces).not.toHaveBeenCalled();
  });

  it("returns the normalized address from place details", async () => {
    (getPlaceAddress as jest.Mock).mockResolvedValue({
      ok: true,
      data: "123 Main St, Tampa, FL 33612, USA",
    });

    const response = await details(request({
      placeId: "ChIJ1234567890abcdef",
      sessionToken,
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toBe("123 Main St, Tampa, FL 33612, USA");
  });

  it("does not call Google when place details is rate limited", async () => {
    (rateLimit as jest.Mock).mockResolvedValue({ success: false, remaining: 0, reset: Date.now() + 60_000 });

    const response = await details(request({
      placeId: "ChIJ1234567890abcdef",
      sessionToken,
    }));

    expect(response.status).toBe(429);
    expect(getPlaceAddress).not.toHaveBeenCalled();
  });
});
