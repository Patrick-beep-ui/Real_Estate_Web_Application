/// <reference types="jest" />

jest.unmock("@/components/leads/AddressAutocomplete");

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import AddressAutocomplete from "@/components/leads/AddressAutocomplete";

describe("AddressAutocomplete proxy fallback", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    delete (window as any).google;
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function renderAutocomplete(onChange = jest.fn()) {
    render(
      <AddressAutocomplete
        id="property-address"
        value=""
        onChange={onChange}
      />
    );
    return { input: screen.getByLabelText("Property Address") };
  }

  it("uses server suggestions when the Maps JavaScript key is unavailable", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "https://ipinfo.io/json") {
        return Promise.resolve({ json: async () => ({}) });
      }
      if (url === "/api/places/autocomplete") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            suggestions: [{ placeId: "ChIJ1234567890abcdef", description: "123 Main St, Tampa, FL" }],
          }),
        });
      }
      if (url === "/api/places/details") {
        return Promise.resolve({
          ok: true,
          json: async () => "123 Main St, Tampa, FL 33612",
        });
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    const onChange = jest.fn();
    const { input } = renderAutocomplete(onChange);
    fireEvent.change(input, { target: { value: "123 Main" } });

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "123 Main St, Tampa, FL" })).toBeTruthy();
    });
    expect(screen.getByText("Powered by Google")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "123 Main St, Tampa, FL" }));

    await waitFor(() => {
      expect(input).toHaveProperty("value", "123 Main St, Tampa, FL 33612");
    });
    expect(onChange).toHaveBeenLastCalledWith(
      "123 Main St, Tampa, FL 33612",
      expect.objectContaining({ source: "server_places_selected", canAdvance: true })
    );
  });

  it("falls back to strict manual entry when the proxy is unavailable", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "https://ipinfo.io/json") {
        return Promise.resolve({ json: async () => ({}) });
      }
      return Promise.resolve({ ok: false, json: async () => ({}) });
    });

    const onChange = jest.fn();
    const { input } = renderAutocomplete(onChange);
    fireEvent.change(input, { target: { value: "123 Main St" } });

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    await waitFor(() => {
      expect(screen.getByText(/Address suggestions are unavailable/i)).toBeTruthy();
    });
    expect(onChange).toHaveBeenLastCalledWith(
      "123 Main St",
      expect.objectContaining({ source: "api_fallback", canAdvance: false })
    );
  });
});
