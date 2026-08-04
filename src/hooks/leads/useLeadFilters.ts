"use client";

import { useState, useMemo, useCallback } from "react";
import { getTrafficSourceLabel } from "@/lib/tracking/traffic-source";
import type { Lead } from "@/lib/leads/types";

export type { Lead };

export type QualificationFilter = {
  id: string;
  question: string;
  value: string;
};

let filterIdCounter = 0;
function nextFilterId() {
  return `qf-${++filterIdCounter}-${Date.now()}`;
}

export function getAdPlatform(lead: Lead): { label: string; color: string } | null {
  const label = getTrafficSourceLabel(lead);
  if (label === "Direct / Organic") return null;
  const color = label === "Google Ads" ? "bg-blue-500/20 border-blue-500/40 text-green-400"
    : label === "Meta Ads" ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
    : "bg-orange-500/20 border-orange-500/40 text-orange-400";
  return { label, color };
}

export function useLeadFilters(leads: Lead[] | undefined) {
  const [search, setSearch] = useState("");
  const [filterAdPlatform, setFilterAdPlatform] = useState("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [qualificationFilters, setQualificationFilters] = useState<QualificationFilter[]>([]);

  const addQualificationFilter = useCallback((question: string) => {
    setQualificationFilters((prev) => {
      if (prev.some((f) => f.question === question)) return prev;
      return [...prev, { id: nextFilterId(), question, value: "" }];
    });
  }, []);

  const updateQualificationFilter = useCallback((id: string, value: string) => {
    setQualificationFilters((prev) =>
      prev.map((f) => (f.id === id ? { ...f, value } : f))
    );
  }, []);

  const removeQualificationFilter = useCallback((id: string) => {
    setQualificationFilters((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    return leads.filter((lead) => {
      const s = search.toLowerCase();
      const matchesSearch = !search || lead.name.toLowerCase().includes(s) || lead.phone.includes(s) || (lead.email?.toLowerCase().includes(s));
      const platform = getAdPlatform(lead);
      const matchesAdPlatform = filterAdPlatform === "all" || (
        filterAdPlatform === "ads" ? !!platform
          : filterAdPlatform === "organic" ? !platform
            : platform?.label === filterAdPlatform
      );
      const leadDate = new Date(lead.created_at);
      const from = dateRange.from ? new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate()) : null;
      const to = dateRange.to ? new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate(), 23, 59, 59, 999) : null;
      const matchesDate = (!from || leadDate >= from) && (!to || leadDate <= to);
      const matchesQualifications = qualificationFilters.every((f) => {
        if (!f.value) return true;
        return (lead as Record<string, unknown>)[f.question] === f.value;
      });
      return matchesSearch && matchesAdPlatform && matchesDate && matchesQualifications;
    });
  }, [leads, search, filterAdPlatform, dateRange, qualificationFilters]);

  return {
    filteredLeads,
    search, setSearch,
    filterAdPlatform, setFilterAdPlatform,
    dateRange, setDateRange,
    qualificationFilters, addQualificationFilter, updateQualificationFilter, removeQualificationFilter,
  };
}
