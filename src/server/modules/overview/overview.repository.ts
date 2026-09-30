import { prisma } from "@/server/db/prisma";
import { LeadStatus } from "@/generated/prisma/client";

export type OverviewStats = {
  total: number;
  newCount: number;
  closedCount: number;
  todayCount: number;
  errorCount: number;
  dripsSent: number;
  dripsFailed: number;
  dripsPending: number;
  dripFailRate: number;
};

export async function getOverviewStats(): Promise<OverviewStats> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [total, newCount, closedCount, todayCount, errorCount, dripsTotal, dripsSent, dripsFailed, dripsPending] =
    await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: LeadStatus.new } }),
      prisma.lead.count({ where: { status: LeadStatus.closed } }),
      prisma.lead.count({ where: { createdAt: { gte: today } } }),
      prisma.leadError.count(),
      prisma.dripSequence.count({ where: { createdAt: { gte: since24h } } }),
      prisma.dripSequence.count({ where: { status: "sent", createdAt: { gte: since24h } } }),
      prisma.dripSequence.count({ where: { status: "failed", createdAt: { gte: since24h } } }),
      prisma.dripSequence.count({ where: { status: "pending", createdAt: { gte: since24h } } }),
    ]);

  const dripFailRate = dripsTotal > 0 ? Math.round((dripsFailed / dripsTotal) * 100) : 0;

  return { total, newCount, closedCount, todayCount, errorCount, dripsSent, dripsFailed, dripsPending, dripFailRate };
}