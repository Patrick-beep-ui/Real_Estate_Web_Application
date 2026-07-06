import { notifySlack } from "@/lib/notify";
import { SLACK_WEBHOOK_URL_SUCCESS } from "@/lib/env";
import { maskPhone, maskEmail } from "./helpers";

const TAG = "[TBH:leads:notify]";

function formatLeadSummary(data: any, trafficSource: string): string {
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
  ];
  return rows.join("\n");
}

export async function notifyLeadCaptured(data: any, trafficSource: string, ghlStatus: string): Promise<void> {
  await notifySlack(
    `✅ *Lead Captured*\n${formatLeadSummary(data, trafficSource)}\n• GHL: ${ghlStatus}`,
    SLACK_WEBHOOK_URL_SUCCESS
  );
}

export async function notifyLeadPartial(data: any, trafficSource: string, ghlSynced: boolean): Promise<void> {
  await notifySlack(
    `✅ *Lead Captured (Partial)*\n${formatLeadSummary(data, trafficSource)}\n• GHL: ${ghlSynced ? "Synced" : "Failed"}`,
    SLACK_WEBHOOK_URL_SUCCESS
  );
}

export async function notifyLeadError(title: string, data: any, trafficSource: string, extraLines: string[]): Promise<void> {
  await notifySlack(
    `❌ *${title}*\n${formatLeadSummary(data, trafficSource)}\n${extraLines.join("\n")}`
  );
}

export async function notifyRateLimit(ip: string, data: any, resetTime: string): Promise<void> {
  const fields: string[] = [];
  if (data.name) fields.push(`👤 ${data.name}`);
  if (data.phone) fields.push(`📞 ${maskPhone(data.phone)}`);
  if (data.email) fields.push(`📧 ${maskEmail(data.email)}`);
  if (data.trafficSource) fields.push(`🎯 ${data.trafficSource}`);
  const extra = fields.length > 0 ? `\n${fields.join(" | ")}` : "";
  await notifySlack(`🚫 Rate limit hit for \`${ip}\` on \`leads/submit\`${extra}\n🔄 Resets at ${resetTime}`);
}

export async function notifyDuplicateOpportunity(data: any, trafficSource: string, contactId: string, contactName: string, matchField?: string): Promise<void> {
  let msg =
    `🔁 *Duplicate Lead — New Opportunity Created in GHL*\n` +
    `• Name: ${data.name || "—"}\n` +
    `• Phone: ${data.phone || "—"}\n` +
    `• Address: ${data.property_address || "—"}\n` +
    `• Traffic Source: ${trafficSource}\n` +
    `• Timeline: ${data.timeline_to_sell || "—"}\n` +
    `• Listed: ${data.listed_with_agent || "—"}\n` +
    `• Property Age: ${data.property_age || "—"}\n` +
    `• Existing Contact: ${contactName || contactId}`;
  if (matchField) msg += `\n• Match Field: ${matchField}`;
  await notifySlack(msg, SLACK_WEBHOOK_URL_SUCCESS);
}

export async function notifyOpportunityFailed(data: any, trafficSource: string, contactId: string, error: unknown): Promise<void> {
  await notifySlack(
    `❌ *Duplicate Lead — Opportunity Creation Failed*\n` +
    `• Name: ${data.name || "—"}\n` +
    `• Phone: ${data.phone || "—"}\n` +
    `• Email: ${data.email || "—"}\n` +
    `• Address: ${data.property_address || "—"}\n` +
    `• Traffic Source: ${trafficSource}\n` +
    `• Timeline: ${data.timeline_to_sell || "—"}\n` +
    `• Listed: ${data.listed_with_agent || "—"}\n` +
    `• Property Age: ${data.property_age || "—"}\n` +
    `• Existing Contact: ${contactId}\n` +
    `• Error: ${error instanceof Error ? error.message : "Unknown"}`
  );
}
