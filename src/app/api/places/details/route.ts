import { NextRequest, NextResponse } from "next/server";
import { getPlaceAddress, isValidPlacesPlaceId, isValidPlacesSessionToken } from "@/lib/leads/places";
import { rateLimit } from "@/lib/shared/rate-limit";
import { getClientIp } from "@/lib/shared/requests"

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    const limited = await rateLimit("places/details", ip, {
        max: 10,
        windowSeconds: 60,
        failOpen: false,
    });

    if (!limited.success) {
        return NextResponse.json({
            error: "places_unavailable"
            }, 
            { status: 429 }
        );
    }

    let body: { placeId?: unknown; sessionToken?: unknown };

    try {
        body = await request.json();
    } catch (err) {
        return NextResponse.json({ error: "invalid_request", details: err }, { status: 400 });
    }

    if(!isValidPlacesPlaceId(body.placeId) || !isValidPlacesSessionToken(body.sessionToken)) {
        return NextResponse.json({ error: "invalid_request", details: "Invalid placeId or session token" }, { status: 400 });
    }

    const result = await getPlaceAddress(body.placeId, body.sessionToken);

    if (!result.ok) {
        return NextResponse.json({ error: "places_unavailable", details: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data);
}