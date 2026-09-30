import { prisma } from "@/server/db/prisma"
import { LeadStatus } from "@/generated/prisma/client";


type AnalyticsCount = {
    name: string;
    count: number;
}

export type AnalyticsStats = {
    conversionRate: number;
    timeSeries: { date: string; count: number }[];
    statusBreakdown: { name: string; value: number}[];
    topMarkets: AnalyticsCount[];
    topSituations: AnalyticsCount[];
}

function localDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export async function getAnalyticsStats(): Promise<AnalyticsStats> {
    const end = new Date();
    end.setHours(0, 0, 0, 0)
    end.setDate(end.getDate() + 1)

    const start = new Date(end);
    start.setDate(start.getDate() - 14);

    const [statusGroups, marketGroups, situationGroups, recentLeads] = await Promise.all([
        prisma.lead.groupBy({
            by: ["status"],
            _count: { _all: true },
        }),
        prisma.lead.groupBy({
            by: ["marketSlug"],
            _count: { _all: true },
        }),
        prisma.lead.groupBy({
            by: ["situationSlug"],
            _count: { _all: true },
        }),
        prisma.lead.findMany({
            where: {
                createdAt: {
                    gte: start,
                    lt: end,
                },
            },
            select: { createdAt: true }
        })
    ]);

    const statusCounts = new Map(
        statusGroups.map(({ status, _count }) => [status, _count._all]),
    );

    const total = statusGroups.reduce((sum, group) => sum + group._count._all, 0);
    const closedCount = statusCounts.get(LeadStatus.closed) ?? 0;
    const conversionRate = total > 0 ? Math.round((closedCount / total) * 1000) / 10 : 0;

    const statusBreakdown = Object.values(LeadStatus).flatMap((status) => {
        const value = statusCounts.get(status);
        return value ? [{ name: status, value }] : [];
    });

    const topMarkets = marketGroups
        .map(({ marketSlug, _count }) => ({ name: marketSlug, count: _count._all }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        .slice(0, 8);

    const topSituations = situationGroups
        .map(({ situationSlug, _count }) => ({ name: situationSlug, count: _count._all }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        .slice(0, 8);
    
    const dayCounts = new Map<string, number>();
    
    for(let i = 0; i < 14; i++) {
        const day = new Date(start);
        day.setDate(day.getDate() + i);
        dayCounts.set(localDateKey(day), 0);
    }

    for(const { createdAt } of recentLeads) {
        const key = localDateKey(createdAt);
        const count = dayCounts.get(key);
        if(count !== undefined) {
            dayCounts.set(key, count + 1)
        }
    }

    const timeSeries = Array.from(dayCounts, ([date, count]) => ({ date, count }));

    return {
        conversionRate,
        timeSeries,
        statusBreakdown,
        topMarkets,
        topSituations
    };
}
