/// <reference types="jest" />

import {
  autocompletePlaces,
  getPlaceAddress,
  isValidPlacesPlaceId,
  isValidPlacesSessionToken,
} from "@/lib/leads/places";

const sessionToken = "a".repeat(32);

describe("Places API helper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_PLACES_SERVER_KEY = "test-google-places-server-key";
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete process.env.GOOGLE_PLACES_SERVER_KEY;
  });

  it("validates session tokens and place IDs before routes call Google", () => {
    expect(isValidPlacesSessionToken(sessionToken)).toBe(true);
    expect(isValidPlacesSessionToken("short")).toBe(false);
    expect(isValidPlacesPlaceId("ChIJ1234567890abcdef")).toBe(true);
    expect(isValidPlacesPlaceId("bad id")).toBe(false);
  });

  it("maps only usable autocomplete predictions", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        suggestions: [
          {
            placePrediction: {
              placeId: "ChIJ1234567890abcdef",
              text: { text: "123 Main St, Tampa, FL" },
            },
          },
          { queryPrediction: { text: { text: "ignored" } } },
        ],
      }),
    });

    await expect(autocompletePlaces("123 Main", sessionToken)).resolves.toEqual({
      ok: true,
      data: [{ placeId: "ChIJ1234567890abcdef", description: "123 Main St, Tampa, FL" }],
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://places.googleapis.com/v1/places:autocomplete",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("requests only address fields for place details", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ formattedAddress: "123 Main St, Tampa, FL 33612, USA" }),
    });

    await expect(
      getPlaceAddress("ChIJ1234567890abcdef", sessionToken)
    ).resolves.toEqual({ ok: true, data: "123 Main St, Tampa, FL 33612, USA" });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`sessionToken=${sessionToken}`),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Goog-FieldMask": "formattedAddress,addressComponents",
        }),
      })
    );
  });

  it("does not make a request without a Places server key", async () => {
    delete process.env.GOOGLE_PLACES_SERVER_KEY;

    await expect(autocompletePlaces("123 Main", sessionToken)).resolves.toEqual({
      ok: false,
      status: 503,
      error: "no_key",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
