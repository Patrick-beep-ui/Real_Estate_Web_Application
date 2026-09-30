import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

const MAX_TRACKING_RESULTS = 1000;

export const TRACKING_TRAFFIC_FILTERS = [
  "all",
  "internal_test",
  "meta_paid",
  "google_paid",
  "microsoft_paid",
  "organic_direct",
  "other",
  "unknown",
] as const;

export const TRACKING_TEST_FILTERS = ["all", "real", "internal_test"] as const;

export type TrackingTrafficFilter = (typeof TRACKING_TRAFFIC_FILTERS)[number];
export type TrackingTestFilter = (typeof TRACKING_TEST_FILTERS)[number];

export type TrackingQueryFilters = {
  from?: Date;
  to?: Date;
  traffic: TrackingTrafficFilter;
  test: TrackingTestFilter;
};

export type AdminTrackingDeliveryEvent = {
  id: string;
  submission_id: string;
  service: string;
  operation: string;
  outcome: string;
  attempt_number: number;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  http_status: number | null;
  external_reference: string | null;
  meta_event_id: string | null;
  meta_events_received: number | null;
  error_code: string | null;
  error_message: string | null;
  metadata_redacted: unknown;
  created_at: string;
};

export type AdminTrackingSubmission = {
  id: string;
  created_at: string;
  lead_id: string | null;
  idempotency_key: string | null;
  source: string | null;
  page_path: string | null;
  traffic_classification: string;
  is_internal_test: boolean;
  form_status: string;
  meta_event_id: string | null;
  fbp: string | null;
  fbc: string | null;
  fbclid: string | null;
  fb_campaign_id: string | null;
  fb_adset_id: string | null;
  fb_ad_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  utm_id: string | null;
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  msclkid: string | null;
  events: AdminTrackingDeliveryEvent[];
};

export type AdminTrackingResponse = {
  items: AdminTrackingSubmission[];
  truncated: boolean;
};

const trackingInclude = {
  deliveryEvents: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.TrackingSubmissionInclude;

type TrackingRow = Prisma.TrackingSubmissionGetPayload<{ include: typeof trackingInclude }>;

function trackingWhere(filters: TrackingQueryFilters): Prisma.TrackingSubmissionWhereInput {
  const conditions: Prisma.TrackingSubmissionWhereInput[] = [];

  if (filters.from || filters.to) {
    conditions.push({
      createdAt: {
        ...(filters.from ? { gte: filters.from } : {}),
        ...(filters.to ? { lte: filters.to } : {}),
      },
    });
  }

  if (filters.traffic === "unknown") {
    conditions.push({ OR: [{ source: null }, { source: "" }] });
  } else if (filters.traffic !== "all") {
    conditions.push({ trafficClassification: filters.traffic });
  }

  if (filters.test === "real") {
    conditions.push({ isInternalTest: false });
  } else if (filters.test === "internal_test") {
    conditions.push({ isInternalTest: true });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

function mapDeliveryEvent(row: TrackingRow["deliveryEvents"][number]): AdminTrackingDeliveryEvent {
  return {
    id: row.id,
    submission_id: row.submissionId,
    service: row.service,
    operation: row.operation,
    outcome: row.outcome,
    attempt_number: row.attemptNumber,
    started_at: row.startedAt?.toISOString() ?? null,
    completed_at: row.completedAt?.toISOString() ?? null,
    duration_ms: row.durationMs,
    http_status: row.httpStatus,
    external_reference: row.externalReference,
    meta_event_id: row.metaEventId,
    meta_events_received: row.metaEventsReceived,
    error_code: row.errorCode,
    error_message: row.errorMessage,
    metadata_redacted: row.metadataRedacted,
    created_at: row.createdAt.toISOString(),
  };
}

function mapTrackingSubmission(row: TrackingRow): AdminTrackingSubmission {
  return {
    id: row.id,
    created_at: row.createdAt.toISOString(),
    lead_id: row.leadId,
    idempotency_key: row.idempotencyKey,
    source: row.source,
    page_path: row.pagePath,
    traffic_classification: row.trafficClassification,
    is_internal_test: row.isInternalTest,
    form_status: row.formStatus,
    meta_event_id: row.metaEventId,
    fbp: row.fbp,
    fbc: row.fbc,
    fbclid: row.fbclid,
    fb_campaign_id: row.fbCampaignId,
    fb_adset_id: row.fbAdsetId,
    fb_ad_id: row.fbAdId,
    utm_source: row.utmSource,
    utm_medium: row.utmMedium,
    utm_campaign: row.utmCampaign,
    utm_content: row.utmContent,
    utm_term: row.utmTerm,
    utm_id: row.utmId,
    gclid: row.gclid,
    gbraid: row.gbraid,
    wbraid: row.wbraid,
    msclkid: row.msclkid,
    events: row.deliveryEvents.map(mapDeliveryEvent),
  };
}

export async function getAdminTrackingSubmissions(
  filters: TrackingQueryFilters,
): Promise<AdminTrackingResponse> {
  const rows = await prisma.trackingSubmission.findMany({
    where: trackingWhere(filters),
    orderBy: { createdAt: "desc" },
    include: trackingInclude,
    take: MAX_TRACKING_RESULTS + 1,
  });

  return {
    items: rows.slice(0, MAX_TRACKING_RESULTS).map(mapTrackingSubmission),
    truncated: rows.length > MAX_TRACKING_RESULTS,
  };
}
