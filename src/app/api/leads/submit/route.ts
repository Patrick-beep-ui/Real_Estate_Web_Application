import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/types";
import { parseAddress } from "@/lib/address";
import { notifySlack } from "@/lib/notify";
import { describeGhlError } from "@/lib/errors/ghl";

const TAG = "[API:leads/submit]";

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const GHL_API_BASE_URL = process.env.GHL_API_BASE_URL || "https://services.leadconnectorhq.com";
const GHL_PIPELINE_ID = process.env.GHL_PIPELINE_ID;
const GHL_PIPELINE_STAGE_ID = process.env.GHL_PIPELINE_STAGE_ID;
const MIN_RECAPTCHA_SCORE = 0.5;

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
  if (firstSpace === -1) return { firstName: trimmed, lastName: "" };
  return {
    firstName: trimmed.substring(0, firstSpace),
    lastName: trimmed.substring(firstSpace + 1).trim(),
  };
}

export async function POST(request: NextRequest) {
  const start = performance.now();

  try {
    const body = await request.json();
    const { recaptchaToken, idempotencyKey, ...leadData } = body;
    const { name, phone, email, market_slug, situation_slug, source } = leadData;

    if (!name || !phone) {
      return NextResponse.json({ error: "Missing required fields: name, phone" }, { status: 400 });
    }

    // --- Idempotency check (double-submit guard) ---
    if (idempotencyKey) {
      const { data: existingKey } = await supabase
        .from("idempotency_keys")
        .select("response_status, response_body")
        .eq("key", idempotencyKey)
        .maybeSingle();

      if (existingKey) {
        console.log(`${TAG} Idempotency hit for key ${idempotencyKey}`);
        return NextResponse.json(existingKey.response_body as Record<string, unknown>, { status: existingKey.response_status });
      }
    }

    // Verify reCAPTCHA token server-side
    if (!RECAPTCHA_SECRET_KEY) {
      console.warn(`${TAG} RECAPTCHA_SECRET_KEY not configured — skipping verification`);
    } else if (!recaptchaToken) {
      console.warn(`${TAG} No reCAPTCHA token provided`);
      return NextResponse.json({ error: "Missing reCAPTCHA token" }, { status: 400 });
    } else {
      const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: RECAPTCHA_SECRET_KEY,
          response: recaptchaToken,
        }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.success || verifyData.score < MIN_RECAPTCHA_SCORE) {
        console.warn(`${TAG} reCAPTCHA failed:`, {
          success: verifyData.success,
          score: verifyData.score,
          errorCodes: verifyData["error-codes"],
        });
        return NextResponse.json({ error: "reCAPTCHA verification failed" }, { status: 400 });
      }

      console.log(`${TAG} reCAPTCHA passed — score: ${verifyData.score}`);
    }

    // Insert lead into Supabase
    console.log(`${TAG} Inserting lead`, {
      phone: maskPhone(phone),
      email: email ? maskEmail(email) : "(none)",
      market: market_slug,
      situation: situation_slug,
      source,
    });

    const insertPayload = {
      name,
      phone,
      email: email || null,
      market_slug,
      situation_slug,
      source: source || null,
      property_address: leadData.property_address || null,
      page_path: leadData.page_path || null,
      utm_source: leadData.utm_source || null,
      utm_medium: leadData.utm_medium || null,
      utm_campaign: leadData.utm_campaign || null,
      utm_content: leadData.utm_content || null,
      utm_term: leadData.utm_term || null,
      gclid: leadData.gclid || null,
      fbclid: leadData.fbclid || null,
      msclkid: leadData.msclkid || null,
      consent_transactional: leadData.consent_transactional ?? false,
      consent_promotional: leadData.consent_promotional ?? false,
    };

    // --- Step 1: Try Supabase (source of truth) ---
    let dbSuccess = false;
    const { error: dbError } = await supabase.from("leads").insert(insertPayload);

    if (dbError) {
      // Unique constraint violation on phone — lead already exists, not a real error
      if (dbError.code === "23505") {
        console.log(`${TAG} Duplicate phone detected — returning success (existing lead)`);
        dbSuccess = true;

        if (idempotencyKey) {
          (async () => {
            const { error: ie } = await supabase.from("idempotency_keys").insert({
              key: idempotencyKey,
              response_status: 200,
              response_body: { success: true, duplicate: true } as Json,
            });
            if (ie) console.warn(`${TAG} Failed to store idempotency key:`, ie);
          })();
        }

        return NextResponse.json({ success: true, duplicate: true });
      }

      const elapsed = (performance.now() - start).toFixed(0);
      console.error(`${TAG} DB insert failed after ${elapsed}ms:`, {
        code: dbError.code,
        message: dbError.message,
      });

      try {
        await supabase.from("lead_errors").insert({
          name,
          phone,
          email: email || null,
          market_slug: market_slug || null,
          situation_slug: situation_slug || null,
          source: source || null,
          property_address: leadData.property_address || null,
          error_code: dbError.code,
          error_message: dbError.message,
          error_details: dbError.details || null,
        });
      } catch (logErr) {
        console.warn(`${TAG} Could not log DB error to lead_errors:`, logErr);
      }

      notifySlack(
        `❌ *Lead Submission Failed — DB Error*\n` +
        `• Name: ${name || "—"}\n` +
        `• Phone: ${phone || "—"}\n` +
        `• Address: ${leadData.property_address || "—"}\n` +
        `• Market: ${market_slug || "—"}\n` +
        `• Code: ${dbError.code}\n` +
        `• Message: ${dbError.message}`
      );
    } else {
      dbSuccess = true;
    }

    // --- Step 2: Try GHL (independent of Supabase) ---
    let ghlSuccess = false;

    if (GHL_API_KEY && GHL_API_KEY !== "your_ghl_api_key_here" && GHL_LOCATION_ID && GHL_LOCATION_ID !== "your_ghl_location_id_here") {
      const { firstName, lastName } = splitName(name);
      const { property_address, utm_source, utm_medium, utm_campaign, gclid, fbclid, msclkid } = leadData;

      const customFields: Array<{ key: string; value: string }> = [];
      if (utm_source) customFields.push({ key: "utm_source", value: utm_source });
      if (utm_medium) customFields.push({ key: "utm_medium", value: utm_medium });
      if (utm_campaign) customFields.push({ key: "utm_campaign", value: utm_campaign });
      if (gclid) customFields.push({ key: "google_gclid", value: gclid });
      if (fbclid) customFields.push({ key: "fbclid", value: fbclid });
      if (msclkid) customFields.push({ key: "msclkid", value: msclkid });
      //if (property_address) customFields.push({ key: "address1", value: property_address });

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
      if (email) ghlPayload.email = email;
      if (property_address) {
        const parsed = parseAddress(property_address);
        ghlPayload.address1 = parsed.street;
        ghlPayload.city = parsed.city;
        ghlPayload.state = parsed.state;
        ghlPayload.postalCode = parsed.zip;
      }
      if (customFields.length > 0) ghlPayload.customFields = customFields;

      try {
        const ghlResponse = await fetch(`${GHL_API_BASE_URL}/contacts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GHL_API_KEY}`,
            Version: "2021-07-28",
          },
          body: JSON.stringify(ghlPayload),
        });

        if (!ghlResponse.ok) {
          const errData = await ghlResponse.json().catch(() => ({}));
          const isDuplicate = ghlResponse.status === 400 && errData?.meta?.contactId;

          if (isDuplicate && GHL_PIPELINE_ID && GHL_PIPELINE_STAGE_ID) {
            // Existing contact — create an opportunity instead
            const contactId = errData.meta.contactId as string;
            console.log(`${TAG} GHL duplicate — creating opportunity for contactId ${contactId}`);

            try {
              const oppPayload = {
                pipelineId: GHL_PIPELINE_ID,
                locationId: GHL_LOCATION_ID,
                name: leadData.property_address
                  ? `${errData.meta.contactName || name} - ${leadData.property_address}`
                  : (errData.meta.contactName || name),
                pipelineStageId: GHL_PIPELINE_STAGE_ID,
                status: "open",
                contactId,
              };

              const oppResponse = await fetch(`${GHL_API_BASE_URL}/opportunities/`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${GHL_API_KEY}`,
                  Version: "2021-07-28",
                },
                body: JSON.stringify(oppPayload),
              });

              if (!oppResponse.ok) {
                const oppErr = await oppResponse.json().catch(() => ({}));
                console.error(`${TAG} GHL opportunity creation failed:`, oppErr);
                throw new Error(oppErr.message || "Opportunity creation failed");
              }

              ghlSuccess = true;
              console.log(`${TAG} ✔ GHL opportunity created for existing contact ${contactId}`);

              notifySlack(
                `🔁 *Duplicate Lead — New Opportunity Created in GHL*\n` +
                `• Name: ${name || "—"}\n` +
                `• Phone: ${phone || "—"}\n` +
                `• Address: ${leadData.property_address || "—"}\n` +
                `• Existing Contact: ${errData.meta.contactName || contactId}\n` +
                `• Match Field: ${errData.meta?.matchingField || "—"}`
              );
            } catch (oppErr) {
              console.error(`${TAG} GHL opportunity creation threw:`, oppErr);

              try {
                await supabase.from("lead_errors").insert({
                  name,
                  phone,
                  email: email || null,
                  market_slug: market_slug || null,
                  situation_slug: situation_slug || null,
                  source: source || null,
                  property_address: leadData.property_address || null,
                  error_code: "GHL_OPPORTUNITY_ERROR",
                  error_message: `GHL duplicate contact — opportunity creation failed: ${oppErr instanceof Error ? oppErr.message : "Unknown"}`,
                  error_details: JSON.stringify({ contactId: errData.meta.contactId, originalError: errData }),
                });
              } catch (logErr) {
                console.warn(`${TAG} Could not log GHL opportunity error:`, logErr);
              }

              notifySlack(
                `❌ *Duplicate Lead — Opportunity Creation Failed*\n` +
                `• Name: ${name || "—"}\n` +
                `• Phone: ${phone || "—"}\n` +
                `• Address: ${leadData.property_address || "—"}\n` +
                `• Existing Contact: ${errData.meta.contactName || errData.meta.contactId}\n` +
                `• Error: ${oppErr instanceof Error ? oppErr.message : "Unknown"}`
              );
            }
          } else {
            // Non-duplicate GHL error — existing behavior
            console.error(`${TAG} GHL contact creation failed:`, { status: ghlResponse.status, error: errData });

            try {
              await supabase.from("lead_errors").insert({
                name,
                phone,
                email: email || null,
                market_slug: market_slug || null,
                situation_slug: situation_slug || null,
                source: source || null,
                property_address: leadData.property_address || null,
                error_code: "GHL_ERROR",
                error_message: `GHL contact creation failed: ${errData.message || "Unknown error"}`,
                error_details: JSON.stringify({ status: ghlResponse.status, response: errData }),
              });
            } catch (logErr) {
              console.warn(`${TAG} Could not log GHL error to lead_errors:`, logErr);
            }

            notifySlack(
              `❌ *Lead Submission Failed — GHL API Error*\n` +
              `• Name: ${name || "—"}\n` +
              `• Phone: ${phone || "—"}\n` +
              `• Address: ${leadData.property_address || "—"}\n` +
              `• Status: ${ghlResponse.status}\n` +
              `• Message: ${describeGhlError(errData)}\n` +
              `• Match Field: ${errData.meta?.matchingField || "—"}`
            );
          }
        } else {
          ghlSuccess = true;
          console.log(`${TAG} ✔ GHL contact created`);
        }
      } catch (err) {
        console.error(`${TAG} GHL fetch error:`, err);

        try {
          await supabase.from("lead_errors").insert({
            name,
            phone,
            email: email || null,
            market_slug: market_slug || null,
            situation_slug: situation_slug || null,
            source: source || null,
            property_address: leadData.property_address || null,
            error_code: "GHL_FETCH_ERROR",
            error_message: err instanceof Error ? err.message : "Unknown error",
            error_details: err instanceof Error ? err.stack : String(err),
          });
          } catch (logErr) {
            console.warn(`${TAG} Could not log GHL error to lead_errors:`, logErr);
          }

          notifySlack(
`❌ *Lead Submission Failed — GHL Network Error*\n` +
          `• Name: ${name || "—"}\n` +
          `• Phone: ${phone || "—"}\n` +
          `• Address: ${leadData.property_address || "—"}\n` +
          `• Message: ${err instanceof Error ? err.message : "Unknown error"}`
          );
        }
      } else {
      ghlSuccess = true; // skipped, not an error
      console.warn(`${TAG} GHL not configured — skipping contact creation`);
    }

    // --- Step 3: Determine response based on combined outcome ---
    const elapsed = (performance.now() - start).toFixed(0);

    let responseStatus = 200;
    let responseBody: Record<string, unknown> = { success: true };

    if (dbSuccess && ghlSuccess) {
      console.log(`${TAG} ✔ Lead submitted in ${elapsed}ms`);
      responseBody = { success: true };
      notifySlack(
        `✅ *Lead Captured*\n` +
        `• Name: ${name || "—"}\n` +
        `• Phone: ${phone || "—"}\n` +
        `• Email: ${email || "—"}\n` +
        `• Address: ${leadData.property_address || "—"}\n` +
        `• Market: ${market_slug || "—"}\n` +
        `• Situation: ${situation_slug || "—"}\n` +
        `• Source: ${source || "—"}\n` +
        `• GHL: Synced`,
        process.env.SLACK_WEBHOOK_URL_SUCCESS
      );
    } else if (!dbSuccess && !ghlSuccess) {
      console.error(`${TAG} Both DB and GHL failed after ${elapsed}ms`);
      responseStatus = 500;
      responseBody = { error: "Failed to save lead" };
    } else {
      const warnings: string[] = [];
      if (!dbSuccess) warnings.push("Database unavailable, lead saved to GHL only");
      if (!ghlSuccess) warnings.push("GHL sync failed");
      console.warn(`${TAG} Partial success after ${elapsed}ms:`, warnings.join(", "));
      responseBody = { success: true, warnings };
      notifySlack(
        `✅ *Lead Captured (Partial)*\n` +
        `• Name: ${name || "—"}\n` +
        `• Phone: ${phone || "—"}\n` +
        `• Email: ${email || "—"}\n` +
        `• Address: ${leadData.property_address || "—"}\n` +
        `• Market: ${market_slug || "—"}\n` +
        `• Situation: ${situation_slug || "—"}\n` +
        `• Source: ${source || "—"}\n` +
        `• GHL: ${ghlSuccess ? "Synced" : "Failed"}`,
        process.env.SLACK_WEBHOOK_URL_SUCCESS
      );
    }

    if (idempotencyKey) {
      (async () => {
        const { error: ie } = await supabase.from("idempotency_keys").insert({
          key: idempotencyKey,
          response_status: responseStatus,
          response_body: responseBody as Json,
        });
        if (ie) console.warn(`${TAG} Failed to store idempotency key:`, ie);
      })();
    }

    return NextResponse.json(responseBody, { status: responseStatus });
  } catch (error) {
    const elapsed = (performance.now() - start).toFixed(0);
    console.error(`${TAG} Unexpected error after ${elapsed}ms:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
