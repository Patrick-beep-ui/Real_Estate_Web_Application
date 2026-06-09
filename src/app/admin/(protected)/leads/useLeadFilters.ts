"use client";

import { useState, useMemo } from "react";

export type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  property_address: string | null;
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
  gclid: string | null;
  fbclid: string | null;
  msclkid: string | null;
  source: string;
  page_path: string | null;
};

export function getAdPlatform(lead: Lead): { label: string; color: string } | null {
  if (lead.gclid || lead.utm_source === "adwords") return { label: "Google Ads", color: "bg-blue-500/20 border-blue-500/40 text-green-400" };
  if (lead.fbclid || lead.utm_source === "facebook" || lead.utm_source === "meta") return { label: "Meta Ads", color: "bg-indigo-500/20 border-indigo-500/40 text-indigo-400" };
  if (lead.msclkid) return { label: "Microsoft Ads", color: "bg-green-500/20 border-green-500/40 text-green-400" };
  return null;
}

export function useLeadFilters(leads: Lead[] | undefined) {
  const [search, setSearch] = useState("");
  const [filterAdPlatform, setFilterAdPlatform] = useState("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    return leads.filter((lead) => {
      const s = search.toLowerCase();
      const matchesSearch = !search || lead.name.toLowerCase().includes(s) || lead.phone.includes(s) || (lead.email?.toLowerCase().includes(s));
      const platform = getAdPlatform(lead);
      const matchesAdPlatform = filterAdPlatform === "all" || (
        filterAdPlatform === "organic" ? !platform : platform?.label === filterAdPlatform
      );
      const leadDate = new Date(lead.created_at);
      const from = dateRange.from ? new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate()) : null;
      const to = dateRange.to ? new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate(), 23, 59, 59, 999) : null;
      const matchesDate = (!from || leadDate >= from) && (!to || leadDate <= to);
      return matchesSearch && matchesAdPlatform && matchesDate;
    });
  }, [leads, search, filterAdPlatform, dateRange]);

  return { filteredLeads, search, setSearch, filterAdPlatform, setFilterAdPlatform, dateRange, setDateRange };
}
