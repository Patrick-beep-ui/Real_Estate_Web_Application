/// <reference types="jest" />

import { renderHook, act } from "@testing-library/react";
import { isSupabaseStorageUrl, isBrokenHttpStatus } from "@/lib/shared/url-health";
import { useUrlHealth } from "@/hooks/testimonials/useUrlHealth";

const STORAGE_URL =
  "https://mcgzyxrozhogzmohyfos.supabase.co/storage/v1/object/public/testimonial-videos/Angie-Malone.mp4";

describe("url-health", () => {
  describe("isSupabaseStorageUrl()", () => {
    it("accepts supabase public storage object URLs", () => {
      expect(isSupabaseStorageUrl(STORAGE_URL)).toBe(true);
    });

    it("accepts authenticated storage object URLs", () => {
      expect(
        isSupabaseStorageUrl(
          "https://mcgzyxrozhogzmohyfos.supabase.co/storage/v1/object/testimonial-videos/Angie-Malone.mp4"
        )
      ).toBe(true);
    });

    it("rejects non-supabase URLs", () => {
      expect(isSupabaseStorageUrl("https://example.com/video.mp4")).toBe(false);
      expect(isSupabaseStorageUrl("https://www.youtube.com/watch?v=abc123")).toBe(false);
    });

    it("rejects supabase URLs that are not storage objects", () => {
      expect(isSupabaseStorageUrl("https://mcgzyxrozhogzmohyfos.supabase.co/auth/v1/user")).toBe(false);
    });

    it("rejects empty strings", () => {
      expect(isSupabaseStorageUrl("")).toBe(false);
      expect(isSupabaseStorageUrl("   ")).toBe(false);
    });
  });

  describe("isBrokenHttpStatus()", () => {
    it("flags definitive 4xx client errors", () => {
      expect(isBrokenHttpStatus(400)).toBe(true);
      expect(isBrokenHttpStatus(401)).toBe(true);
      expect(isBrokenHttpStatus(403)).toBe(true);
      expect(isBrokenHttpStatus(404)).toBe(true);
      expect(isBrokenHttpStatus(410)).toBe(true);
    });

    it("ignores 405 (HEAD not allowed — server may still serve the asset)", () => {
      expect(isBrokenHttpStatus(405)).toBe(false);
    });

    it("ignores success and 5xx statuses", () => {
      expect(isBrokenHttpStatus(200)).toBe(false);
      expect(isBrokenHttpStatus(204)).toBe(false);
      expect(isBrokenHttpStatus(500)).toBe(false);
      expect(isBrokenHttpStatus(503)).toBe(false);
    });
  });

  describe("useUrlHealth()", () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
      jest.useRealTimers();
    });

    function mockFetchResponse(status: number) {
      global.fetch = jest.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status });
    }

    it("stays unknown for non-storage URLs without fetching", async () => {
      global.fetch = jest.fn();
      const { result } = renderHook(() => useUrlHealth("https://example.com/video.mp4"));
      await act(async () => {});
      expect(result.current.state).toBe("unknown");
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("stays unknown for empty URLs", async () => {
      global.fetch = jest.fn();
      const { result } = renderHook(() => useUrlHealth(""));
      await act(async () => {});
      expect(result.current.state).toBe("unknown");
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("reports broken for a storage URL that 404s", async () => {
      jest.useFakeTimers();
      mockFetchResponse(404);
      const { result } = renderHook(() => useUrlHealth(STORAGE_URL));
      expect(result.current.state).toBe("unknown");
      await act(async () => {
        jest.advanceTimersByTime(600);
      });
      expect(result.current.state).toBe("broken");
      expect(result.current.statusCode).toBe(404);
    });

    it("reports ok for a storage URL that responds 200", async () => {
      jest.useFakeTimers();
      mockFetchResponse(200);
      const { result } = renderHook(() => useUrlHealth(STORAGE_URL));
      await act(async () => {
        jest.advanceTimersByTime(600);
      });
      expect(result.current.state).toBe("ok");
      expect(result.current.statusCode).toBe(200);
    });

    it("reports unknown when the request fails (network/CORS) instead of warning", async () => {
      jest.useFakeTimers();
      global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));
      const { result } = renderHook(() => useUrlHealth(STORAGE_URL));
      await act(async () => {
        jest.advanceTimersByTime(600);
      });
      expect(result.current.state).toBe("unknown");
      expect(result.current.statusCode).toBeNull();
    });

    it("debounces rapid URL changes", async () => {
      jest.useFakeTimers();
      global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
      const { result, rerender } = renderHook(({ url }) => useUrlHealth(url), {
        initialProps: { url: STORAGE_URL },
      });
      await act(async () => {
        jest.advanceTimersByTime(300);
      });
      expect(result.current.state).toBe("unknown");
      rerender({ url: `${STORAGE_URL}?v=2` });
      await act(async () => {
        jest.advanceTimersByTime(300);
      });
      expect(result.current.state).toBe("unknown");
      await act(async () => {
        jest.advanceTimersByTime(600);
      });
      expect(result.current.state).toBe("ok");
    });
  });
});
