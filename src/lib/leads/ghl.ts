import { parseAddress } from "@/lib/address";
import { describeGhlError } from "@/lib/errors/ghl";
import { notifySlack } from "@/lib/notify";
import { logLeadError } from "./supabase";
import { notifyDuplicateOpportunity, notifyOpportunityFailed } from "./notifications";
import { splitName, areAddressesDifferent } from "./helpers";

const TAG = "[TBH:leads:ghl]";
const GHL_API_BASE_URL = process.env.GHL_API_BASE_URL || "https://services.leadconnectorhq.com";

export type GhlConfig = {
  apiKey: string;
  locationId: string;
  pipelineId?: string;
  pipelineStageId?: string;
};

export type GhlResult = {
  success: boolean;
};

function buildGhlPayload(leadData: any, config: GhlConfig): Record<string, unknown> {
  const { name, phone, email, market_slug, situation_slug, source } = leadData;
  const { firstName, lastName } = splitName(name);
  const { property_address, utm_source, utm_medium, utm_campaign, utm_content, utm_term, page_path, gclid, fbclid, msclkid, property_age, listed_with_agent, timeline_to_sell, consent_promotional, consent_transactional } = leadData;

  const customFields: Array<{ key: string; value: string }> = [];
  if (utm_source) customFields.push({ key: "utm_source", value: utm_source });
  if (utm_medium) customFields.push({ key: "utm_medium", value: utm_medium });
  if (utm_campaign) customFields.push({ key: "utm_campaign", value: utm_campaign });
  if (utm_content) customFields.push({ key: "utm_content", value: utm_content });
  if (utm_term) customFields.push({ key: "utm_term", value: utm_term });
  if (gclid) customFields.push({ key: "google_gclid", value: gclid });
  if (fbclid) customFields.push({ key: "fbclid", value: fbclid });
  if (msclkid) customFields.push({ key: "msclkid", value: msclkid });
  if (property_age) customFields.push({ key: "property_age_year_build", value: property_age });
  if (listed_with_agent) customFields.push({ key: "listed_with_another_realtor", value: listed_with_agent });
  if (timeline_to_sell) customFields.push({ key: "timeline_to_sell", value: timeline_to_sell });
  if (page_path) customFields.push({ key: "landing_page", value: page_path });
  if (consent_transactional !== undefined) customFields.push({ key: "optin_status", value: consent_transactional ? "Yes" : "No" });
  if (consent_promotional !== undefined) customFields.push({ key: "optin_marketing_status", value: consent_promotional ? "Yes" : "No" });
  if (gclid) customFields.push({ key: "google_gclid", value: gclid });
  if (fbclid) customFields.push({ key: "fbclid", value: fbclid });
  if (msclkid) customFields.push({ key: "msclkid", value: msclkid });

  const payload: Record<string, unknown> = {
    firstName,
    lastName,
    phone,
    locationId: config.locationId,
    tags: [
      "website: Tarek Buys Houses",
      `source:${source || "unknown"}`,
      `market:${market_slug || "unknown"}`,
      `situation:${situation_slug || "unknown"}`,
      "lead",
    ],
  };
  if (email) payload.email = email;
  if (property_address) {
    const parsed = parseAddress(property_address);
    payload.address1 = parsed.street;
    payload.city = parsed.city;
    payload.state = parsed.state;
    payload.postalCode = parsed.zip;
  }
  if (customFields.length > 0) payload.customFields = customFields;

  return payload;
}

async function createContact(ghlPayload: Record<string, unknown>, config: GhlConfig): Promise<Response> {
  return fetch(`${GHL_API_BASE_URL}/contacts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      Version: "2021-07-28",
    },
    body: JSON.stringify(ghlPayload),
  });
}

async function getContact(contactId: string, config: GhlConfig): Promise<Record<string, any> | null> {
  try {
    const res = await fetch(`${GHL_API_BASE_URL}/contacts/${contactId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        Version: "2021-07-28",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.contact || null;
  } catch {
    return null;
  }
}

async function createOpportunity(contactId: string, contactName: string, leadData: any, config: GhlConfig): Promise<void> {
  if (!config.pipelineId || !config.pipelineStageId) {
    throw new Error("Pipeline ID or stage ID not configured");
  }
  const oppPayload: Record<string, unknown> = {
    pipelineId: config.pipelineId,
    locationId: config.locationId,
    name: leadData.property_address
      ? `${contactName} - ${leadData.property_address}`
      : contactName,
    pipelineStageId: config.pipelineStageId,
    status: "open",
    contactId,
  };
  const res = await fetch(`${GHL_API_BASE_URL}/opportunities/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      Version: "2021-07-28",
    },
    body: JSON.stringify(oppPayload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Opportunity creation failed");
  }
}

export async function syncLeadToGhl(leadData: any, config: GhlConfig, trafficSource: string): Promise<GhlResult> {
  const ghlPayload = buildGhlPayload(leadData, config);

  try {
    const response = await createContact(ghlPayload, config);

    if (response.ok) {
      console.log(`${TAG} ✔ GHL contact created`);
      return { success: true };
    }

    const errData = await response.json().catch(() => ({}));
    const isDuplicate = response.status === 400 && errData?.meta?.contactId;

    if (isDuplicate && config.pipelineId && config.pipelineStageId) {
      const contactId = errData.meta.contactId as string;
      const contactName = errData.meta.contactName || leadData.name;

      const existingContact = await getContact(contactId, config);

      if (existingContact) {
        const diff = areAddressesDifferent(existingContact, leadData.property_address);
        if (diff === false || diff === null) {
          const reason = diff === false ? "same address" : "no address to compare";
          console.log(`${TAG} GHL duplicate — ${reason}, skipping opportunity for contactId ${contactId}`);
          return { success: true };
        }
        console.log(`${TAG} GHL duplicate — different address, creating opportunity for contactId ${contactId}`);
      } else {
        console.warn(`${TAG} Failed to fetch existing contact ${contactId} — falling back to opportunity creation`);
      }

      try {
        await createOpportunity(contactId, contactName, leadData, config);
        console.log(`${TAG} ✔ GHL opportunity created for existing contact ${contactId}`);
        await notifyDuplicateOpportunity(leadData, trafficSource, contactId, contactName, errData.meta?.matchingField);
        return { success: true };
      } catch (oppErr) {
        console.error(`${TAG} GHL opportunity creation failed:`, oppErr);
        await logLeadError({
          name: leadData.name,
          phone: leadData.phone,
          email: leadData.email || null,
          market_slug: leadData.market_slug || null,
          situation_slug: leadData.situation_slug || null,
          source: leadData.source || null,
          property_address: leadData.property_address || null,
          error_code: "GHL_OPPORTUNITY_ERROR",
          error_message: `Duplicate contact — opportunity creation failed: ${oppErr instanceof Error ? oppErr.message : "Unknown"}`,
          error_details: JSON.stringify({ contactId, originalError: errData }),
        });
        await notifyOpportunityFailed(leadData, trafficSource, contactId, oppErr);
        return { success: false };
      }
    }

    const status = response.status;
    const errMessage = errData.message || "Unknown error";
    console.error(`${TAG} GHL contact creation failed:`, { status, error: errData });
    await logLeadError({
      name: leadData.name,
      phone: leadData.phone,
      email: leadData.email || null,
      market_slug: leadData.market_slug || null,
      situation_slug: leadData.situation_slug || null,
      source: leadData.source || null,
      property_address: leadData.property_address || null,
      error_code: "GHL_ERROR",
      error_message: `GHL contact creation failed: ${errMessage}`,
      error_details: JSON.stringify({ status, response: errData }),
    });
    await notifySlackError(
      `❌ *Lead Submission Failed — GHL API Error*\n` +
      `• Name: ${leadData.name || "—"}\n` +
      `• Phone: ${leadData.phone || "—"}\n` +
      `• Email: ${leadData.email || "—"}\n` +
      `• Address: ${leadData.property_address || "—"}\n` +
      `• Traffic Source: ${trafficSource}\n` +
      `• Status: ${status}\n` +
      `• Message: ${describeGhlError(errData)}\n` +
      `• Match Field: ${errData.meta?.matchingField || "—"}`
    );
    return { success: false };
  } catch (err) {
    console.error(`${TAG} GHL fetch error:`, err);
    await logLeadError({
      name: leadData.name,
      phone: leadData.phone,
      email: leadData.email || null,
      market_slug: leadData.market_slug || null,
      situation_slug: leadData.situation_slug || null,
      source: leadData.source || null,
      property_address: leadData.property_address || null,
      error_code: "GHL_FETCH_ERROR",
      error_message: err instanceof Error ? err.message : "Unknown error",
      error_details: err instanceof Error ? err.stack : String(err),
    });
    await notifySlackError(
      `❌ *Lead Submission Failed — GHL Network Error*\n` +
      `• Name: ${leadData.name || "—"}\n` +
      `• Phone: ${leadData.phone || "—"}\n` +
      `• Address: ${leadData.property_address || "—"}\n` +
      `• Traffic Source: ${trafficSource}\n` +
      `• Message: ${err instanceof Error ? err.message : "Unknown error"}`
    );
    return { success: false };
  }
}

async function notifySlackError(message: string): Promise<void> {
  await notifySlack(message);
}
