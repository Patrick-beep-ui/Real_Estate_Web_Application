import { NextRequest, NextResponse } from "next/server";
import { autocompletePlaces, isValidPlacesSessionToken } from "@/lib/leads/places";
import { rateLimit } from "@/lib/shared/rate-limit";
import { getClientIp } from "@/lib/shared/requests";

const MIN_INPUT_LENGTH = 2;
const MAX_INPUT_LENGTH = 250;

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    const limited = await rateLimit("places/autocomplete", ip, {
        max: 30,
        windowSeconds: 60,
        failOpen: false,
    });

    if(!limited.success) {
        return NextResponse.json({
            error: "rate_limited",
            remaining: limited.remaining,
            reset: limited.reset,
            }, 
            { status: 429 }
        );
    }

    let body: { input?: unknown, sessionToken?: unknown };

    try {
        body = await request.json();
    } catch(err) {
        return NextResponse.json({ error: "invalid_request", details: err }, { status: 400 });
    }

    const input = typeof body.input === "string" ? body.input.trim() : "";

    if(
        input.length < MIN_INPUT_LENGTH ||
        input.length > MAX_INPUT_LENGTH ||
        !isValidPlacesSessionToken(body.sessionToken)
    ) {
        return NextResponse.json({ error: "invalid_request", details: "Invalid input or session token" }, { status: 400 });
    }

    const result = await autocompletePlaces(input, body.sessionToken);

    if(!result.ok) {
        return NextResponse.json({ error: "places_unavailable", details: result.error }, { status: result.status });
    }

    return NextResponse.json({ suggestions: result.data });
}