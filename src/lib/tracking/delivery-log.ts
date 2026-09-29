/**
 * Server-only, append-only delivery audit for lead submissions.
 *
 * SAFETY CONTRACT
 * ---------------
 * Every export in this module is best-effort observability. None of them may
 * throw, reject, or block the lead pipeline they observe. Each wraps its body
 * in try/catch, degrades to a console warning, and returns null/void on
 * failure.
 *
 * This module is deliberately NOT imported by `src/lib/leads/supabase.ts` or
 * any other lead write path. A tracking failure must never be able to fail a
 * lead submission.
 *
 * Writes use the service-role client because the tracking tables are
 * RLS-restricted to admin SELECT only — browsers and anon clients cannot write.
 */

import "server-only";

import { tryGetSupabaseAdmin } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import type { LeadData } from "@/lib/leads/types";

const TAG = "[TBH:tracking-delivery]";

/**
 * Service-role client acquisition that can never throw, not even if the
 * underlying accessor misbehaves. Client creation happens INSIDE each writer's
 * try/catch for the same reason: this module is a best-effort observability
 * layer, so no failure mode of the client may escape into the lead pipeline.
 */
function getAdminOrNull() {
  try {
    return tryGetSupabaseAdmin();
  } catch (error) {
    console.warn(`${TAG} service client unavailable`, error);
    return null;
  }
}

export type TrackingFormStatus = "accepted" | "duplicate" | "partial" | "failed";
export type TrafficClassification =
  | "internal_test"
  | "meta_paid"
  | "google_paid"
  | "microsoft_paid"
  | "organic_direct"
  | "other";

export type DeliveryService = "form" | "database" | "ghl_contact" | "ghl_opportunity" | "meta_capi";
export type DeliveryOutcome = "started" | "succeeded" | "failed" | "skipped";

/**
 * Priority order matters: an explicit `tracking_test=1` marker always wins so
 * internal QA traffic is never mistaken for paid traffic, and paid identifiers
 * are checked before generic UTMs so a tagged paid click is not filed as
 * "other".
 */
export function classifyTraffic(lead: Pick<LeadData, "tracking_test" | "fbclid" | "fb_campaign_id" | "fb_adset_id" | "fb_ad_id" | "gclid" | "gbraid" | "wbraid" | "msclkid" | "utm_source" | "utm_medium" | "utm_campaign">): TrafficClassification {
  if (lead.tracking_test) return "internal_test";
  if (
    lead.fbclid ||
    lead.fb_campaign_id ||
    lead.fb_adset_id ||
    lead.fb_ad_id ||
    lead.utm_source === "facebook" ||
    lead.utm_source === "meta"
  ) {
    return "meta_paid";
  }
  if (lead.gclid || lead.gbraid || lead.wbraid || lead.utm_source === "google" || lead.utm_source === "adwords") {
    return "google_paid";
  }
  if (lead.msclkid) return "microsoft_paid";
  if (!lead.utm_source && !lead.utm_medium && !lead.utm_campaign) return "organic_direct";
  return "other";
}

export async function createTrackingSubmission(
  lead: LeadData,
  idempotencyKey?: string | null
): Promise<string | null> {
  const admin = getAdminOrNull();
  if (!admin) return null;

  try {
    const { data, error } = await admin
      .from("tracking_submissions")
      .insert({
        idempotency_key: idempotencyKey || null,
        source: lead.source || null,
        page_path: lead.page_path || null,
        traffic_classification: classifyTraffic(lead),
        is_internal_test: Boolean(lead.tracking_test),
        meta_event_id: lead.meta_event_id || null,
        fbp: lead.fbp || null,
        fbc: lead.fbc || null,
        fbclid: lead.fbclid || null,
        fb_campaign_id: lead.fb_campaign_id || null,
        fb_adset_id: lead.fb_adset_id || null,
        fb_ad_id: lead.fb_ad_id || null,
        utm_source: lead.utm_source || null,
        utm_medium: lead.utm_medium || null,
        utm_campaign: lead.utm_campaign || null,
        utm_content: lead.utm_content || null,
        utm_term: lead.utm_term || null,
        utm_id: lead.utm_id || null,
        gclid: lead.gclid || null,
        gbraid: lead.gbraid || null,
        wbraid: lead.wbraid || null,
        msclkid: lead.msclkid || null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  } catch (error) {
    console.warn(`${TAG} could not create submission`, error);
    return null;
  }
}

export async function updateTrackingSubmission(
  submissionId: string | null,
  values: { leadId?: string | null; formStatus?: TrackingFormStatus }
): Promise<void> {
  if (!submissionId) return;
  const admin = getAdminOrNull();
  if (!admin) return;

  try {
    const update: { lead_id?: string | null; form_status?: TrackingFormStatus } = {};
    if ("leadId" in values) update.lead_id = values.leadId;
    if (values.formStatus) update.form_status = values.formStatus;
    const { error } = await admin.from("tracking_submissions").update(update).eq("id", submissionId);
    if (error) throw error;
  } catch (error) {
    console.warn(`${TAG} could not update submission ${submissionId}`, error);
  }
}

/**
 * Read-only lookup of the most recent lead for a phone number. This resolves
 * the `lead_id` link without touching `insertLead`, so the lead write path is
 * completely unchanged.
 */
export async function resolveLeadIdByPhone(phone: string): Promise<string | null> {
  const admin = getAdminOrNull();
  if (!admin) return null;

  try {
    const { data, error } = await admin
      .from("leads")
      .select("id")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data?.id ?? null;
  } catch (error) {
    console.warn(`${TAG} could not resolve lead id for phone`, error);
    return null;
  }
}

export type DeliveryEventInput = {
  service: DeliveryService;
  operation: string;
  outcome: DeliveryOutcome;
  attemptNumber?: number;
  startedAt?: string | null;
  completedAt?: string | null;
  durationMs?: number | null;
  httpStatus?: number | null;
  externalReference?: string | null;
  metaEventId?: string | null;
  metaEventsReceived?: number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: Json;
};

export async function recordTrackingDelivery(
  submissionId: string | null,
  event: DeliveryEventInput
): Promise<void> {
  if (!submissionId) return;
  const admin = getAdminOrNull();
  if (!admin) return;

  try {
    const { error } = await admin.from("tracking_delivery_events").insert({
      submission_id: submissionId,
      service: event.service,
      operation: event.operation,
      outcome: event.outcome,
      attempt_number: event.attemptNumber ?? 1,
      started_at: event.startedAt ?? null,
      completed_at: event.completedAt ?? null,
      duration_ms: event.durationMs ?? null,
      http_status: event.httpStatus ?? null,
      external_reference: event.externalReference ?? null,
      meta_event_id: event.metaEventId ?? null,
      meta_events_received: event.metaEventsReceived ?? null,
      error_code: event.errorCode ?? null,
      error_message: event.errorMessage?.slice(0, 1000) ?? null,
      metadata_redacted: event.metadata ?? {},
    });
    if (error) throw error;
  } catch (error) {
    console.warn(`${TAG} could not record ${event.service}/${event.operation}`, error);
  }
}

/** Convenience helper for a started -> terminal pair around one operation. */
export function startDeliveryTimer() {
  const startedAt = new Date().toISOString();
  return {
    startedAt,
    elapsedMs: () => Math.max(0, Date.now() - new Date(startedAt).getTime()),
  };
}
