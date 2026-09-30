import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { STAGE_TO_STATUS } from "@/lib/leads/types";

type PipelineStageValue =
  | "new"
  | "contacted"
  | "offer_made"
  | "under_contract"
  | "closed"
  | "lost";

type LeadStatusValue = "new" | "contacted" | "qualified" | "closed" | "lost";

const LEAD_SELECT = {
  id: true,
  name: true,
  phone: true,
  email: true,
  marketSlug: true,
  situationSlug: true,
  source: true,
  utmSource: true,
  utmMedium: true,
  utmCampaign: true,
  status: true,
  createdAt: true,
  propertyAddress: true,
  notes: true,
  pipelineStage: true,
  offerAmount: true,
  gclid: true,
  fbclid: true,
  msclkid: true,
  pagePath: true,
  utmContent: true,
  utmTerm: true,
  utmId: true,
  fbAdsetId: true,
  fbCampaignId: true,
  timelineToSell: true,
  listedWithAgent: true,
  propertyAge: true,
  tzBrowser: true,
  tzIp: true,
  addressVerified: true,
  addressSource: true,
  gbraid: true,
  wbraid: true,
  sellerState: true,
  sellerCountry: true,
} satisfies Prisma.LeadSelect;

type LeadRow = Prisma.LeadGetPayload<{ select: typeof LEAD_SELECT }>;

export type AdminLead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  property_address: string | null;
  address_source: string | null;
  address_verified: boolean | null;
  pipeline_stage: string | null;
  status: string | null;
  offer_amount: number | null;
  notes: string | null;
  market_slug: string;
  situation_slug: string;
  created_at: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  utm_id: string | null;
  fb_adset_id: string | null;
  fb_campaign_id: string | null;
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  fbclid: string | null;
  msclkid: string | null;
  source: string;
  page_path: string | null;
  timeline_to_sell: string | null;
  listed_with_agent: string | null;
  property_age: string | null;
  tz_browser: string | null;
  tz_ip: string | null;
  seller_state: string | null;
  seller_country: string | null;
};

const PIPELINE_STAGE_VALUES = new Set<string>([
  "new",
  "contacted",
  "offer_made",
  "under_contract",
  "closed",
  "lost",
] satisfies PipelineStageValue[]);
const LEAD_STATUS_VALUES = new Set<string>(["new", "contacted", "qualified", "closed", "lost"] satisfies LeadStatusValue[]);

const UPDATE_KEYS = ["offer_amount", "pipeline_stage", "status", "notes"] as const;

export type LeadUpdateInput = {
  offer_amount?: number | null;
  pipeline_stage?: string | null;
  status?: string | null;
  notes?: string;
};

export type LeadPatch = Record<string, unknown>;

export function mapLeadRow(row: LeadRow): AdminLead {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    property_address: row.propertyAddress,
    address_source: row.addressSource,
    address_verified: row.addressVerified,
    pipeline_stage: row.pipelineStage.toString(),
    status: row.status.toString(),
    offer_amount: row.offerAmount === null ? null : Number(row.offerAmount),
    notes: row.notes,
    market_slug: row.marketSlug,
    situation_slug: row.situationSlug,
    created_at: row.createdAt.toISOString(),
    utm_source: row.utmSource,
    utm_medium: row.utmMedium,
    utm_campaign: row.utmCampaign,
    utm_content: row.utmContent,
    utm_term: row.utmTerm,
    utm_id: row.utmId,
    fb_adset_id: row.fbAdsetId,
    fb_campaign_id: row.fbCampaignId,
    gclid: row.gclid,
    gbraid: row.gbraid,
    wbraid: row.wbraid,
    fbclid: row.fbclid,
    msclkid: row.msclkid,
    source: row.source,
    page_path: row.pagePath,
    timeline_to_sell: row.timelineToSell,
    listed_with_agent: row.listedWithAgent,
    property_age: row.propertyAge,
    tz_browser: row.tzBrowser,
    tz_ip: row.tzIp,
    seller_state: row.sellerState,
    seller_country: row.sellerCountry,
  };
}

export function parseLeadPatch(body: unknown): LeadUpdateInput {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw ApiError.badRequest("Invalid request body");
  }
  const patch = body as Record<string, unknown>;
  const unknownKey = Object.keys(patch).find((key) => !UPDATE_KEYS.includes(key as (typeof UPDATE_KEYS)[number]));
  if (unknownKey) {
    throw ApiError.badRequest(`Unknown field: ${unknownKey}`);
  }

  const { offer_amount, pipeline_stage, status, notes } = patch;

  if (offer_amount !== undefined && offer_amount !== null && typeof offer_amount !== "number") {
    throw ApiError.badRequest("offer_amount must be a number or null");
  }

  if (pipeline_stage !== undefined && pipeline_stage !== null) {
    if (typeof pipeline_stage !== "string" || !PIPELINE_STAGE_VALUES.has(pipeline_stage)) {
      throw ApiError.badRequest(`Invalid pipeline_stage: ${String(pipeline_stage)}`);
    }
  }

  if (status !== undefined && status !== null) {
    if (typeof status !== "string" || !LEAD_STATUS_VALUES.has(status)) {
      throw ApiError.badRequest(`Invalid status: ${String(status)}`);
    }
  }

  if (notes !== undefined && typeof notes !== "string") {
    throw ApiError.badRequest("notes must be a string");
  }

  return {
    ...(offer_amount !== undefined ? { offer_amount: offer_amount as number | null } : {}),
    ...(pipeline_stage !== undefined ? { pipeline_stage: pipeline_stage as string | null } : {}),
    ...(status !== undefined ? { status: status as string | null } : {}),
    ...(notes !== undefined ? { notes: notes as string } : {}),
  };
}

function toPrismaUpdate(input: LeadUpdateInput): Prisma.LeadUpdateInput {
  const data: Prisma.LeadUpdateInput = { updatedAt: new Date() };
  if (input.offer_amount !== undefined) {
    // Prisma accepts a plain number for Decimal fields; avoids a runtime Decimal import.
    data.offerAmount = input.offer_amount;
  }
  if (input.pipeline_stage !== undefined) {
    data.pipelineStage = input.pipeline_stage as PipelineStageValue;
  }
  if (input.status !== undefined) {
    data.status = input.status as LeadStatusValue;
  }
  if (input.notes !== undefined) {
    data.notes = input.notes;
  }
  return data;
}

function handleMissingRowError(err: unknown, id: string): never {
  const code = (err as { code?: unknown } | null)?.code;
  if (code === "P2025") {
    throw ApiError.notFound(`Lead not found: ${id}`);
  }
  throw err;
}

export async function listLeads(): Promise<AdminLead[]> {
  const rows = await prisma.lead.findMany({
    select: LEAD_SELECT,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapLeadRow);
}

export async function updateLead(id: string, input: LeadUpdateInput): Promise<AdminLead> {
  try {
    const row = await prisma.lead.update({
      where: { id },
      select: LEAD_SELECT,
      data: toPrismaUpdate(input),
    });
    return mapLeadRow(row);
  } catch (err) {
    handleMissingRowError(err, id);
  }
}

export async function batchUpdatePipelineStages(
  changes: Record<string, string>,
): Promise<{ ok: true; count: number }> {
  if (changes === null || typeof changes !== "object" || Array.isArray(changes)) {
    throw ApiError.badRequest("changes must be an object of lead id to pipeline stage");
  }
  const entries = Object.entries(changes);
  if (entries.length === 0) {
    throw ApiError.badRequest("changes must not be empty");
  }

  for (const [id, stage] of entries) {
    if (!id) {
      throw ApiError.badRequest("Lead id must not be empty");
    }
    if (typeof stage !== "string" || !PIPELINE_STAGE_VALUES.has(stage)) {
      throw ApiError.badRequest(`Invalid pipeline stage for lead ${id}: ${String(stage)}`);
    }
  }

  try {
    await prisma.$transaction(
      entries.map(([id, stage]) =>
        prisma.lead.update({
          where: { id },
          data: {
            pipelineStage: stage as PipelineStageValue,
            status: STAGE_TO_STATUS[stage as keyof typeof STAGE_TO_STATUS],
            updatedAt: new Date(),
          },
        }),
      ),
    );
    return { ok: true, count: entries.length };
  } catch (err) {
    handleMissingRowError(err, entries[0]?.[0] ?? "");
  }
}

export async function deleteLead(id: string): Promise<void> {
  try {
    await prisma.lead.delete({ where: { id } });
  } catch (err) {
    handleMissingRowError(err, id);
  }
}