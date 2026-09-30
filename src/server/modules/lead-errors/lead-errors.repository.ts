import type { LeadError, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";

export type AdminLeadError = {
  id: string;
  created_at: string;
  email: string | null;
  error_code: string | null;
  error_details: string | null;
  error_message: string | null;
  last_retry_at: string | null;
  market_slug: string | null;
  name: string | null;
  payload: Record<string, unknown> | null;
  phone: string | null;
  property_address: string | null;
  resolved: boolean;
  resolved_at: string | null;
  retry_batch_id: string | null;
  retry_count: number;
  situation_slug: string | null;
  source: string | null;
};

export type RetryPersistenceInput = {
  id: string;
  retryBatchId: string;
  retryCount: number;
  name: string;
  phone: string;
  beforeGhlSync: Date;
  success: boolean;
  dbError: { code?: string; message?: string; details?: string | null } | null;
  ghlError: { message?: string } | null;
};

function payloadObject(payload: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  return payload as Record<string, unknown>;
}

function mapLeadError(row: LeadError): AdminLeadError {
  return {
    id: row.id,
    created_at: row.createdAt.toISOString(),
    email: row.email,
    error_code: row.errorCode,
    error_details: row.errorDetails,
    error_message: row.errorMessage,
    last_retry_at: row.lastRetryAt?.toISOString() ?? null,
    market_slug: row.marketSlug,
    name: row.name,
    payload: payloadObject(row.payload),
    phone: row.phone,
    property_address: row.propertyAddress,
    resolved: row.resolved,
    resolved_at: row.resolvedAt?.toISOString() ?? null,
    retry_batch_id: row.retryBatchId,
    retry_count: row.retryCount,
    situation_slug: row.situationSlug,
    source: row.source,
  };
}

export async function getAdminLeadErrors(): Promise<AdminLeadError[]> {
  const rows = await prisma.leadError.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(mapLeadError);
}

export async function getLeadErrorById(id: string): Promise<LeadError> {
  const row = await prisma.leadError.findUnique({ where: { id } });
  if (!row) throw ApiError.notFound("Lead error not found");
  return row;
}

export async function setRetryBatchId(id: string, retryBatchId: string): Promise<void> {
  await prisma.leadError.update({ where: { id }, data: { retryBatchId } });
}

export async function persistRetryResult(input: RetryPersistenceInput): Promise<void> {
  const now = new Date();
  const parentData: Prisma.LeadErrorUpdateInput = {
    retryCount: input.retryCount,
    lastRetryAt: now,
    retryBatchId: input.retryBatchId,
  };

  if (input.success) {
    parentData.resolved = true;
    parentData.resolvedAt = now;
  }
  if (input.dbError) {
    parentData.errorCode = input.dbError.code || "RETRY_DB_ERROR";
    parentData.errorMessage = input.dbError.message || "DB insert failed on retry";
    parentData.errorDetails = input.dbError.details || null;
  }
  if (input.ghlError) {
    parentData.errorCode = "GHL_RETRY_ERROR";
    parentData.errorMessage = input.ghlError.message || "GHL sync failed on retry";
  }

  await prisma.$transaction(async (tx) => {
    await tx.leadError.update({ where: { id: input.id }, data: parentData });

    const children = await tx.leadError.findMany({
      where: {
        name: input.name,
        phone: input.phone,
        id: { not: input.id },
        createdAt: { gte: input.beforeGhlSync },
      },
      select: { id: true },
    });

    if (children.length > 0) {
      const childIds = children.map((child) => child.id);
      await tx.leadError.updateMany({
        where: { id: { in: childIds } },
        data: { retryBatchId: input.retryBatchId },
      });
      if (input.success) {
        await tx.leadError.updateMany({
          where: { id: { in: childIds } },
          data: { resolved: true, resolvedAt: now },
        });
      }
    }

    if (input.success) {
      await tx.leadError.updateMany({
        where: { retryBatchId: input.retryBatchId },
        data: { resolved: true, resolvedAt: now },
      });
    }
  });
}

export async function deleteLeadError(id: string): Promise<void> {
  await getLeadErrorById(id);
  await prisma.leadError.delete({ where: { id } });
}

export async function clearResolvedLeadErrors(): Promise<number> {
  const result = await prisma.leadError.deleteMany({ where: { resolved: true } });
  return result.count;
}
