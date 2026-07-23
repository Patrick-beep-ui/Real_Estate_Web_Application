"use client";

import { useState, useMemo } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { getAdPlatform } from "@/hooks/useLeadFilters";
import type { Lead } from "@/lib/leads/types";

export function useLeadSort(filteredLeads: Lead[]) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const sortedLeads = useMemo(() => {
    const sorted = [...filteredLeads];
    if (sortConfig) {
      sorted.sort((a, b) => {
        let aVal: any;
        let bVal: any;
        switch (sortConfig.key) {
          case "name":
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
            break;
          case "created_at":
            aVal = new Date(a.created_at).getTime();
            bVal = new Date(b.created_at).getTime();
            break;
          case "pipeline_stage":
            aVal = a.pipeline_stage ?? "new";
            bVal = b.pipeline_stage ?? "new";
            break;
          case "offer_amount":
            aVal = a.offer_amount ?? 0;
            bVal = b.offer_amount ?? 0;
            break;
          case "market_slug":
            aVal = a.market_slug.toLowerCase();
            bVal = b.market_slug.toLowerCase();
            break;
          case "situation_slug":
            aVal = a.situation_slug.toLowerCase();
            bVal = b.situation_slug.toLowerCase();
            break;
          case "source":
            aVal = getAdPlatform(a)?.label ?? "";
            bVal = getAdPlatform(b)?.label ?? "";
            break;
          default:
            return 0;
        }
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [filteredLeads, sortConfig]);

  const requestSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc" ? { key, direction: "desc" } : null;
      }
      return { key, direction: "asc" };
    });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === "asc"
      ? <ArrowUp className="inline w-3 h-3 ml-1" />
      : <ArrowDown className="inline w-3 h-3 ml-1" />;
  };

  return { sortedLeads, sortConfig, requestSort, getSortIcon };
}
