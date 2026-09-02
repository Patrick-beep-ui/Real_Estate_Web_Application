import { notifySlack } from "@/lib/notify";
import { SLACK_WEBHOOK_URL_SUCCESS } from "@/lib/shared/env";
import type { LeadData } from "./types";

const TAG = "[TBH:leads:notify]";

function formatLeadSummary(data: Partial<LeadData>, trafficSource: string): string {
  const rows = [
    `• Name: ${data.name || "—"}`,
    `• Phone: ${data.phone || "—"}`,
    `• Email: ${data.email || "—"}`,
    `• Address: ${data.property_address || "—"}`,
    `• Market: ${data.market_slug || "—"}`,
    `• Situation: ${data.situation_slug || "—"}`,
    `• Source: ${data.source || "—"}`,
    `• Traffic Source: ${trafficSource}`,
    `• Timeline: ${data.timeline_to_sell || "—"}`,
    `• Listed: ${data.listed_with_agent || "—"}`,
    `• Property Age: ${data.property_age || "—"}`,
    `• Timezone: ${data.tz_browser ?? data.tz_ip ?? "—"}`,
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

export async function notifyLeadAddressFlagged(data: LeadData, trafficSource: string): Promise<void> {
  try {
    await notifySlack(
      `⚠️ *Lead Captured — Address Unverified*\n${formatLeadSummary(data, trafficSource)}\n• Address flagged: shape check failed`,
      SLACK_WEBHOOK_URL_SUCCESS
    );
  } catch (err) {
    console.warn(`${TAG} notifyLeadAddressFlagged failed:`, err instanceof Error ? err.message : err);
  }
}
