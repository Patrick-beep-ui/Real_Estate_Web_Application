// server only helper for places API
import { getGooglePlacesServerKey } from "@/lib/shared/env";

const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const DETAILS_BASE_URL = "https://places.googleapis.com/v1/places";
const REQUEST_TIMEOUT_MS = 4_000;

export type PlacesSuggestion = {
    placeId: string;
    description: string;
};

type PlacesFailure = {
    ok: false;
    status: number;
    error: "no_key" | "timeout" | "network" | "upstream";
};

type PlacesSuccess<T> = {
    ok: true;
    data: T;
}

type PlacesResult<T> = PlacesSuccess<T> | PlacesFailure;

function validSessionToken(value: unknown): value is string {
    return typeof value === "string" && /^[A-Za-z0-9_-]{16,128}$/.test(value);
}

function validPlaceId(value: unknown): value is string {
    return typeof value === "string" && /^[A-Za-z0-9_-]{16,128}$/.test(value);
}

export function isValidPlacesSessionToken(value: unknown): value is string {
    return validSessionToken(value);
}

export function isValidPlacesPlaceId(value: unknown): value is string {
    return validPlaceId(value);
}

async function fetchPlaces(
    url: string,
    init: RequestInit
): Promise<PlacesResult<Response>> {
    const key = getGooglePlacesServerKey();

    if (!key) {
        return { ok: false, status: 503, error: "no_key" };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            ...init,
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": key,
                ...init.headers,
            },
        });

        if (!response.ok) {
            return { ok: false, status: response.status, error: "upstream" };
        }

        return { ok: true, data: response };

    } catch (error) {
        const timedOut = error instanceof Error && error.name === "AbortError";
        return {
            ok: false,
            status: timedOut ? 504 : 502,
            error: timedOut ? "timeout" : "network",
        };
    } finally {
        clearTimeout(timeout);
    }
}

export async function autocompletePlaces(
    input: string,
    sessionToken: string
): Promise<PlacesResult<PlacesSuggestion[]>> {
    const result = await fetchPlaces(AUTOCOMPLETE_URL, {
        method: "POST",
        headers: {
            "X-Goog-FieldMask":
                "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
        },
        body: JSON.stringify({
            input,
            sessionToken,
            includedRegionCodes: ["us"]
        }),
    });

    if (!result.ok) return result;

    const payload = (await result.data.json()) as {
        suggestions?: Array<{
            placePrediction?: {
                placeId?: string;
                text?: { text?: string };
            };
        }>;
    };

    const suggestions = (payload.suggestions || []).flatMap((s) => {
        const placeId = s.placePrediction?.placeId;
        const description = s.placePrediction?.text?.text;

        return placeId && description ? [{ placeId, description }] : [];
    });

    return { ok: true, data: suggestions };
}

export async function getPlaceAddress (
    placeId: string,
    sessionToken: string
): Promise<PlacesResult<string>> {
    const result = await fetchPlaces(`${DETAILS_BASE_URL}/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sessionToken)}`, {
        method: "GET",
        headers: {
            "X-Goog-FieldMask": "formattedAddress,addressComponents",
        },
    });

    if (!result.ok) return result;

    const payload = (await result.data.json()) as {
        formattedAddress?: string;
    };

    if (!payload.formattedAddress?.trim()) {
        return { ok: false, status: 502, error: "upstream" };
    }

    return { ok: true, data: payload.formattedAddress.trim() };
}