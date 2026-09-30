import { prisma } from "@/server/db/prisma";

export type ContentStatus = "draft" | "published";

export type LandingPageStatus = {
  marketSlug: string;
  situationSlug: string;
  status: string;
  version: number;
};

export type TemplateStatus = LandingPageStatus & {
  count: number;
};

export type EmailTemplatePreview = {
  id: string;
  step: number;
  subject: string;
  previewText: string | null;
  bodyText: string | null;
};

export type SmsTemplatePreview = {
  id: string;
  step: number;
  messageText: string;
};

export type ContentPerformanceSnapshot = {
  id: string;
  marketSlug: string;
  situationSlug: string;
  measuredAt: string;
  uniqueSessions: number;
  leadsCount: number;
  conversionRate: number;
  wilsonLowerBound: number;
  performanceTier: string | null;
  regenerated: boolean;
  aiConfidenceScore: number | null;
  autoPublished: boolean;
  notes: string | null;
};

export type StatusUpdateInput = {
  marketSlug: string;
  situationSlug: string;
  version: number;
  status: ContentStatus;
};

export async function getLandingPageStatuses(): Promise<LandingPageStatus[]> {
  const rows = await prisma.generatedContent.findMany({
    select: { marketSlug: true, situationSlug: true, status: true, version: true },
    orderBy: { version: "desc" },
  });

  const statuses = new Map<string, LandingPageStatus>();
  for (const row of rows) {
    const key = `${row.marketSlug}::${row.situationSlug}`;
    if (!statuses.has(key)) {
      statuses.set(key, row);
    }
  }

  return Array.from(statuses.values());
}

export async function setLandingPageStatus(input: StatusUpdateInput): Promise<number> {
  const result = await prisma.generatedContent.updateMany({
    where: {
      marketSlug: input.marketSlug,
      situationSlug: input.situationSlug,
      version: input.version,
    },
    data: { status: input.status },
  });
  return result.count;
}

export async function getEmailSequenceStatuses(): Promise<TemplateStatus[]> {
  const rows = await prisma.emailTemplate.findMany({
    select: { marketSlug: true, situationSlug: true, status: true, version: true, step: true },
    orderBy: { version: "desc" },
  });

  const statuses = new Map<string, TemplateStatus>();
  for (const row of rows) {
    const key = `${row.marketSlug}::${row.situationSlug}`;
    const current = statuses.get(key);
    if (!current) {
      statuses.set(key, { ...row, count: 1 });
    } else if (row.version === current.version) {
      current.count += 1;
    }
  }

  return Array.from(statuses.values());
}

export async function getEmailTemplateVersion(
  marketSlug: string,
  situationSlug: string,
  version: number,
): Promise<EmailTemplatePreview[]> {
  return prisma.emailTemplate.findMany({
    where: { marketSlug, situationSlug, version },
    select: { id: true, step: true, subject: true, previewText: true, bodyText: true },
    orderBy: { step: "asc" },
  });
}

export async function setEmailSequenceStatus(input: StatusUpdateInput): Promise<number> {
  const result = await prisma.emailTemplate.updateMany({
    where: {
      marketSlug: input.marketSlug,
      situationSlug: input.situationSlug,
      version: input.version,
    },
    data: { status: input.status },
  });
  return result.count;
}

export async function getSmsTemplateStatuses(): Promise<TemplateStatus[]> {
  const rows = await prisma.smsTemplate.findMany({
    select: { marketSlug: true, situationSlug: true, status: true, version: true, step: true },
    orderBy: { version: "desc" },
  });

  const statuses = new Map<string, TemplateStatus>();
  for (const row of rows) {
    const key = `${row.marketSlug}::${row.situationSlug}`;
    const current = statuses.get(key);
    if (!current) {
      statuses.set(key, { ...row, count: 1 });
    } else if (row.version === current.version) {
      current.count += 1;
    }
  }

  return Array.from(statuses.values());
}

export async function getSmsTemplateVersion(
  marketSlug: string,
  situationSlug: string,
  version: number,
): Promise<SmsTemplatePreview[]> {
  return prisma.smsTemplate.findMany({
    where: { marketSlug, situationSlug, version },
    select: { id: true, step: true, messageText: true },
    orderBy: { step: "asc" },
  });
}

export async function setSmsTemplateStatus(input: StatusUpdateInput): Promise<number> {
  const result = await prisma.smsTemplate.updateMany({
    where: {
      marketSlug: input.marketSlug,
      situationSlug: input.situationSlug,
      version: input.version,
    },
    data: { status: input.status },
  });
  return result.count;
}

export async function getContentPerformanceSnapshots(): Promise<ContentPerformanceSnapshot[]> {
  const since = new Date(Date.now() - 7 * 86400_000);
  const rows = await prisma.contentPerformance.findMany({
    where: { measuredAt: { gte: since } },
    orderBy: { wilsonLowerBound: "asc" },
    take: 200,
  });

  const snapshots = new Map<string, ContentPerformanceSnapshot>();
  for (const row of rows.sort((a, b) => b.measuredAt.getTime() - a.measuredAt.getTime())) {
    const key = `${row.marketSlug}::${row.situationSlug}`;
    if (!snapshots.has(key)) {
      snapshots.set(key, {
        id: row.id,
        marketSlug: row.marketSlug,
        situationSlug: row.situationSlug,
        measuredAt: row.measuredAt.toISOString(),
        uniqueSessions: row.uniqueSessions,
        leadsCount: row.leadsCount,
        conversionRate: Number(row.conversionRate),
        wilsonLowerBound: Number(row.wilsonLowerBound),
        performanceTier: row.performanceTier,
        regenerated: row.regenerated,
        aiConfidenceScore: row.aiConfidenceScore,
        autoPublished: row.autoPublished,
        notes: row.notes,
      });
    }
  }

  return Array.from(snapshots.values());
}
