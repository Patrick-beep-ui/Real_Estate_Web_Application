import { notifySlack } from "@/lib/notify";
import { SLACK_WEBHOOK_URL_SUCCESS } from "@/lib/shared/env";
import { resolveMarketDisplayTag, resolveSellerLocationLabel } from "./market-tag";
import type { LeadData } from "./types";

const TAG = "[TBH:leads:notify]";

interface MetaCapiFailureContext {
  eventId: string;
  hasFbp: boolean;
  hasFbc: boolean;
  pagePath?: string | null;
}

export interface AttributionClickNotification {
  channel: "call" | "sms";
  target_phone: string | null;
  fbc: string | null;
  fbp: string | null;
  fbclid: string | null;
  fb_adset_id: string | null;
  fb_campaign_id: string | null;
  gclid: string | null;
  msclkid: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  utm_id: string | null;
  page_path: string | null;
  origin_page_path: string | null;
  lead_source: string | null;
}

function formatLeadSummary(data: Partial<LeadData>, trafficSource: string): string {
  const marketTag = resolveMarketDisplayTag(data.property_address);
  const sellerLocation = resolveSellerLocationLabel(data.seller_state, data.seller_country, data.source);
  const rows = [
    `• Name: ${data.name || "—"}`,
    `• Phone: ${data.phone || "—"}`,
    `• Email: ${data.email || "—"}`,
    `• Address: ${data.property_address || "—"}`,
    `• Property Market: ${marketTag === null ? "—" : marketTag}`,
    `• Market Lander: ${data.market_slug || "—"}`,
    `• Situation: ${data.situation_slug || "—"}`,
    `• Source: ${data.source || "—"}`,
    `• Traffic Source: ${trafficSource}`,
    `• Timeline: ${data.timeline_to_sell || "—"}`,
    `• Listed: ${data.listed_with_agent || "—"}`,
    `• Property Age: ${data.property_age || "—"}`,
    `• Market Value: ${data.market_price != null ? `$${Number(data.market_price).toLocaleString()}` : "—"}`,
    `• Lowest Price: ${data.lowest_price != null ? `$${Number(data.lowest_price).toLocaleString()}` : "—"}`,
    `• Timezone: ${data.tz_browser ?? data.tz_ip ?? "—"}`,
    `• Seller Location State: ${sellerLocation || "—"}`,
  ];
  return rows.join("\n");
}

function formatAttributionClickSummary(data: AttributionClickNotification, trafficSource: string, isCall: boolean): string {
    const clickPage = data.page_path || "-";
    const originPage = data.origin_page_path || clickPage;
    const leadSource = data.lead_source || "direct_click";
    const clickIds = [
      ["gclid", data.gclid],
      ["fbclid", data.fbclid],
      ["msclkid", data.msclkid],
      ["Meta Ad Set ID", data.fb_adset_id],
      ["Meta Campaign ID", data.fb_campaign_id],
      ["UTM ID", data.utm_id],
    ].filter(([, value]) => value);

    const rows = [
      `• Channel: ${isCall ? "Phone Call" : "SMS"}`,
      `• Target Phone: ${data.target_phone || "-"}`,
      `• Traffic Source: ${trafficSource}`,
      `• Click Page: ${clickPage}`,
      `• Origin Page: ${originPage}`,
      `• Lead Source: ${leadSource}`,
      `• UTM Source: ${data.utm_source || "-"}`,
      `• UTM Medium: ${data.utm_medium || "-"}`,
      `• UTM Campaign: ${data.utm_campaign || "-"}`,
      ...clickIds.map(([label, value]) => `• ${label}: ${value || "-"}`),
      `• _fbp: ${data.fbp ? "present" : "missing"}`,
      `• _fbc: ${data.fbc ? "present" : "missing"}`,
    ];
    return rows.join("\n");

}

export async function notifyLeadCaptured(data: LeadData, trafficSource: string, ghlStatus: string): Promise<void> {
  try {
    await notifySlack(
      `✅ *Lead Captured*\n${formatLeadSummary(data, trafficSource)}\n• GHL: ${ghlStatus}`,
      SLACK_WEBHOOK_URL_SUCCESS
    );
  } catch (err) {
    console.warn(`${TAG} notifyLeadCaptured failed:`, err instanceof Error ? err.message : err);
  }
}

export async function notifyLeadPartial(data: LeadData, trafficSource: string, ghlSynced: boolean): Promise<void> {
  try {
    await notifySlack(
      `✅ *Lead Captured (Partial)*\n${formatLeadSummary(data, trafficSource)}\n• GHL: ${ghlSynced ? "Synced" : "Failed"}`,
      SLACK_WEBHOOK_URL_SUCCESS
    );
  } catch (err) {
    console.warn(`${TAG} notifyLeadPartial failed:`, err instanceof Error ? err.message : err);
  }
}

export async function notifyLeadError(title: string, data: LeadData, trafficSource: string, extraLines: string[]): Promise<void> {
  try {
    await notifySlack(
      `❌ *${title}*\n${formatLeadSummary(data, trafficSource)}\n${extraLines.join("\n")}`
    );
  } catch (err) {
    console.warn(`${TAG} notifyLeadError failed:`, err instanceof Error ? err.message : err);
  }
}

export async function notifyRateLimit(ip: string, data: Partial<LeadData>, trafficSource: string, resetTime: string): Promise<void> {
  try {
    const fields: string[] = [];
    if (data.name) fields.push(`👤 ${data.name}`);
    if (data.phone) fields.push(`📞 ${data.phone}`);
    if (data.email) fields.push(`📧 ${data.email}`);
    if (trafficSource) fields.push(`🎯 ${trafficSource}`);
    const extra = fields.length > 0 ? `\n${fields.join(" | ")}` : "";
    await notifySlack(`🚫 Rate limit hit for \`${ip}\` on \`leads/submit\`${extra}\n🔄 Resets at ${resetTime}`);
  } catch (err) {
    console.warn(`${TAG} notifyRateLimit failed:`, err instanceof Error ? err.message : err);
  }
}

export async function notifyDuplicateOpportunity(data: LeadData, trafficSource: string, contactId: string, contactName: string, matchField?: string): Promise<void> {
  try {
    const extras = [`• Existing Contact: ${contactName || contactId}`];
    if (matchField) extras.push(`• Match Field: ${matchField}`);
    await notifySlack(
      `🔁 *Duplicate Lead — New Opportunity Created in GHL*\n${formatLeadSummary(data, trafficSource)}\n${extras.join("\n")}`,
      SLACK_WEBHOOK_URL_SUCCESS
    );
  } catch (err) {
    console.warn(`${TAG} notifyDuplicateOpportunity failed:`, err instanceof Error ? err.message : err);
  }
}

export async function notifyDuplicateSkipped(data: LeadData, trafficSource: string, contactId: string, contactName: string): Promise<void> {
  try {
    await notifySlack(
      `⚠️ *Duplicate Lead — No Opportunity Created*\nNeither the existing contact nor the submission has an address to compare.\n${formatLeadSummary(data, trafficSource)}\n• Existing Contact: ${contactName || contactId}`
    );
  } catch (err) {
    console.warn(`${TAG} notifyDuplicateSkipped failed:`, err instanceof Error ? err.message : err);
  }
}

export async function notifyOpportunityFailed(data: LeadData, trafficSource: string, contactId: string, error: unknown): Promise<void> {
  try {
    await notifySlack(
      `❌ *Duplicate Lead — Opportunity Creation Failed*\n${formatLeadSummary(data, trafficSource)}\n• Existing Contact: ${contactId}\n• Error: ${error instanceof Error ? error.message : "Unknown"}`
    );
  } catch (err) {
    console.warn(`${TAG} notifyOpportunityFailed failed:`, err instanceof Error ? err.message : err);
  }
}

export async function notifyLeadAddressFlagged(data: LeadData, trafficSource: string, reason: string): Promise<void> {
  try {
    await notifySlack(
      `⚠️ *Lead Captured — Address Unverified*\n${formatLeadSummary(data, trafficSource)}\n• Reason: ${reason}\n• Raw Address: ${data.property_address || "—"}`,
      SLACK_WEBHOOK_URL_SUCCESS
    );
  } catch (err) {
    console.warn(`${TAG} notifyLeadAddressFlagged failed:`, err instanceof Error ? err.message : err);
  }
}

export async function notifyLeadAddressBlocked(data: LeadData, trafficSource: string, reason: string, message: string): Promise<void> {
  try {
    await notifySlack(
      `⛔ *Lead Rejected — Address Not Verified*\n${formatLeadSummary(data, trafficSource)}\n• Reason: ${reason}\n• Message: ${message}`
    );
  } catch (err) {
    console.warn(`${TAG} notifyLeadAddressBlocked failed:`, err instanceof Error ? err.message : err);
  }
}

/** =================== Attribution Clicks Alerts =================== */

export async function notifyMetaCapiFailure(data: LeadData, trafficSource: string, error: string, ctx: MetaCapiFailureContext): Promise<void> {
  try {
    await notifySlack(
      `⚠️ *Meta CAPI Lead Event Failed*\n${formatLeadSummary(data, trafficSource)}\n• Meta Event ID: ${ctx.eventId}\n• _fbp: ${ctx.hasFbp ? "present" : "missing"}\n• _fbc: ${ctx.hasFbc ? "present" : "missing"}\n• Page: ${ctx.pagePath || "—"}\n• CAPI Error: ${error}`
    );
  } catch (err) {
    console.warn(`${TAG} notifyMetaCapiFailure failed:`, err instanceof Error ? err.message : err);
  }
}

export async function notifyAttributionClickCaptured(data: AttributionClickNotification, trafficSource: string): Promise<void> {
  try {
    const isCall = data.channel === "call";
    await notifySlack(
      `${isCall ? "📞" : "💬"} *${isCall ? "Phone" : "SMS"} Attribution Click Captured*\n${formatAttributionClickSummary(data, trafficSource, isCall)}`,
      SLACK_WEBHOOK_URL_SUCCESS
    )
  } catch(err) {
    console.warn(`${TAG} notifyAttributionClickCaptured failed:`, err instanceof Error ? err.message : err);
  }
}
