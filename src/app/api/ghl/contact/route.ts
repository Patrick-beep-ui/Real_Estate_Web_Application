import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

const TAG = "[API:ghl/contact]";

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const GHL_API_BASE_URL = process.env.GHL_API_BASE_URL || "https://services.leadconnectorhq.com";

// Mask sensitive data for logging
export function maskPhone(phone: string): string {
  return phone.length >= 4 ? `***${phone.slice(-4)}` : "****";
}

export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  return at > 0 ? `***@${email.slice(at + 1)}` : "***";
}

export function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const firstSpace = trimmed.indexOf(" ");
  if (firstSpace === -1) {
    return { firstName: trimmed, lastName: "" };
  }
  return {
    firstName: trimmed.substring(0, firstSpace),
    lastName: trimmed.substring(firstSpace + 1).trim(),
  };
}

export async function POST(request: NextRequest) {
  const start = performance.now();

  try {
    if (!GHL_API_KEY || GHL_API_KEY === "your_ghl_api_key_here") {
      console.warn(`${TAG} GHL_API_KEY not configured, skipping GHL contact creation`);
      return NextResponse.json({ success: false, message: "GHL not configured" }, { status: 200 });
    }

    if (!GHL_LOCATION_ID || GHL_LOCATION_ID === "your_ghl_location_id_here") {
      console.warn(`${TAG} GHL_LOCATION_ID not configured, skipping GHL contact creation`);
      return NextResponse.json({ success: false, message: "GHL location not configured" }, { status: 200 });
    }

    const body = await request.json();
    const {
      name,
      phone,
      email,
      property_address,
      source,
      market_slug,
      situation_slug,
      utm_source,
      utm_medium,
      utm_campaign,
      gclid,
      fbclid,
      msclkid,
    } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Missing required fields: name, phone" }, { status: 400 });
    }

    const { firstName, lastName } = splitName(name);

    // Build GHL contact payload
    const ghlPayload: Record<string, unknown> = {
      firstName,
      lastName,
      phone,
      locationId: GHL_LOCATION_ID,
      tags: [
        "website: Tarek Buys Houses",
        `source:${source || "unknown"}`,
        `market:${market_slug || "unknown"}`,
        `situation:${situation_slug || "unknown"}`,
        "lead",
      ],
    };

    if (email) {
      ghlPayload.email = email;
    }

    /*
    if (property_address) {
      ghlPayload.address = {
        addressLine1: property_address,
        city: "",
        state: "",
        postalCode: "",
        country: "US",
      };
    }
      */

    // Add custom fields for UTM params if present
    const customFields: Array<{ key: string; value: string }> = [];
    if (utm_source) customFields.push({ key: "utm_source", value: utm_source });
    if (utm_medium) customFields.push({ key: "utm_medium", value: utm_medium });
    if (utm_campaign) customFields.push({ key: "utm_campaign", value: utm_campaign });
    if (gclid) customFields.push({ key: "gclid", value: gclid });
    if (fbclid) customFields.push({ key: "fbclid", value: fbclid });
    if (msclkid) customFields.push({ key: "msclkid", value: msclkid });
    if (property_address) { customFields.push({ key: "property_address", value: property_address });}

    if (customFields.length > 0) {
      ghlPayload.customFields = customFields;
    }

    console.log(`${TAG} Creating GHL contact:`, {
      firstName,
      lastName: lastName ? "present" : "(empty)",
      phone: maskPhone(phone),
      email: email ? maskEmail(email) : "(none)",
      market: market_slug,
      situation: situation_slug,
      source,
    });

    // Call GHL API v2
    const ghlResponse = await fetch(`${GHL_API_BASE_URL}/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GHL_API_KEY}`,
        "Version": "2021-07-28",
      },
      body: JSON.stringify(ghlPayload),
    });

    const ghlData = await ghlResponse.json().catch(() => ({}));

    if (!ghlResponse.ok) {
      const elapsed = (performance.now() - start).toFixed(0);
      console.error(`${TAG} GHL API error after ${elapsed}ms:`, {
        status: ghlResponse.status,
        error: ghlData,
      });

      // Log error to lead_errors table (non-blocking)
      try {
        await supabase.from("lead_errors").insert({
          name,
          phone: maskPhone(phone),
          market_slug: market_slug || null,
          situation_slug: situation_slug || null,
          source: source || null,
          error_code: "GHL_ERROR",
          error_message: `GHL contact creation failed: ${ghlData.message || "Unknown error"}`,
          error_details: JSON.stringify({ status: ghlResponse.status, response: ghlData }),
        });
      } catch (logErr) {
        console.warn(`${TAG} Could not log GHL error to lead_errors:`, logErr);
      }

      return NextResponse.json({ success: false, ghlError: ghlData }, { status: 200 });
    }

    const elapsed = (performance.now() - start).toFixed(0);
    console.log(`${TAG} ✔ GHL contact created successfully in ${elapsed}ms`, {
      contactId: ghlData.contact?.id || "unknown",
    });

    return NextResponse.json({ success: true, contact: ghlData.contact });
  } catch (error) {
    const elapsed = (performance.now() - start).toFixed(0);
    console.error(`${TAG} Unexpected error after ${elapsed}ms:`, error);

    // Log unexpected errors (non-blocking)
    try {
      await supabase.from("lead_errors").insert({
        name: "unknown",
        phone: "unknown",
        market_slug: null,
        situation_slug: null,
        source: "ghl_api",
        error_code: "GHL_UNEXPECTED_ERROR",
        error_message: error instanceof Error ? error.message : "Unexpected error",
        error_details: error instanceof Error ? error.stack : String(error),
      });
    } catch (logErr) {
      console.warn(`${TAG} Could not log unexpected error:`, logErr);
    }

    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 200 });
  }
}
