"use client";

import { useMemo } from "react";
import type { Lead } from "@/lib/leads/types";

export function useLeadStats(filteredLeads: Lead[], leads: Lead[] | undefined) {
  return useMemo(() => {
    const closedLeads = filteredLeads.filter((l) => (l.pipeline_stage || "new") === "closed");
    const totalRevenue = closedLeads.reduce((sum, l) => sum + (Number(l.offer_amount) || 0), 0);
    const totalLeads = filteredLeads.length;
    const conversionRate = totalLeads > 0 ? ((closedLeads.length / totalLeads) * 100).toFixed(1) : "0";
    const googleAdsLeads =
      leads?.filter(
        (l) =>
          l.gclid ||
          l.gbraid ||
          l.wbraid ||
          l.utm_source === "adwords"
      ).length ?? 0;
    const metaAdsLeads = leads?.filter((l) => l.fbclid || l.fb_adset_id || l.fb_campaign_id || l.utm_source === "facebook" || l.utm_source === "meta").length ?? 0;

    return { closedLeads, totalRevenue, totalLeads, conversionRate, googleAdsLeads, metaAdsLeads };
  }, [filteredLeads, leads]);
}
