import { supabase } from "@/lib/supabase/client";
import type { Database, Json } from "@/lib/supabase/types";

const TAG = "[TBH:leads:supabase]";

type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];

export type InsertLeadPayload = Pick<LeadInsert,
  | "name" | "phone" | "email" | "market_slug" | "situation_slug" | "source"
  | "property_address" | "address_verified" | "address_source" | "page_path"
  | "utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term"
  | "utm_id" | "fb_adset_id" | "fb_campaign_id" | "fb_ad_id"
  | "gclid" | "gbraid" | "wbraid" | "fbclid" | "msclkid"
  | "consent_transactional" | "consent_promotional"
  | "listed_with_agent" | "property_age" | "timeline_to_sell"
  | "tz_browser" | "tz_ip"
  | "seller_country" | "seller_state"
>;

export type LeadErrorData = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  market_slug?: string | null;
  situation_slug?: string | null;
  source?: string | null;
  property_address?: string | null;
  error_code: string;
  error_message: string;
  error_details?: string | null;
  payload?: Json | null;
  retry_batch_id?: string | null;
};

export async function insertLead(payload: InsertLeadPayload): Promise<{ success: boolean; duplicate: boolean }> {
  const { error } = await supabase.from("leads").insert(payload);
  if (error) {
    if (error.code === "23505") {
      return { success: true, duplicate: true };
    }
    throw error;
  }
  return { success: true, duplicate: false };
}

export async function logLeadError(data: LeadErrorData): Promise<void> {
  try {
    const { error } = await supabase.from("lead_errors").insert(data);
    if (error) console.warn(`${TAG} Failed to log error:`, error);
  } catch (err) {
    console.warn(`${TAG} Could not log error:`, err);
  }
}

export async function checkIdempotencyKey(key: string): Promise<{ response_status: number; response_body: Record<string, unknown> } | null> {
  try {
    const { data } = await supabase
      .from("idempotency_keys")
      .select("response_status, response_body")
      .eq("key", key)
      .maybeSingle();
    if (!data) return null;
    return {
      response_status: data.response_status,
      response_body: data.response_body as Record<string, unknown>,
    };
  } catch (err) {
    console.warn(`${TAG} Idempotency check failed (continuing anyway):`, err instanceof Error ? err.message : err);
    return null;
  }
}

export async function storeIdempotencyKey(key: string, status: number, body: Record<string, unknown>): Promise<void> {
  try {
    const { error } = await supabase.from("idempotency_keys").insert({
      key,
      response_status: status,
      response_body: body as Json,
    });
    if (error) console.warn(`${TAG} Failed to store idempotency key:`, error);
  } catch (err) {
    console.warn(`${TAG} Idempotency store threw (continuing anyway):`, err instanceof Error ? err.message : err);
  }
}
