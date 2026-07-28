"use client";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { AdPlatformFilter } from "@/components/admin/leads/AdPlatformFilter";
import { QualificationFilters } from "@/components/admin/leads/QualificationFilters";
import { DateRangeFilter } from "@/components/admin/leads/DateRangeFilter";
import { ExportButton } from "@/components/admin/leads/ExportButton";
import type { QualificationFilter } from "@/hooks/leads/useLeadFilters";
import type { Lead } from "@/lib/leads/types";

type DateRange = { from?: Date; to?: Date };

export function LeadToolbar({
  search,
  setSearch,
  viewMode,
  setViewMode,
  filterAdPlatform,
  setFilterAdPlatform,
  qualificationFilters,
  addQualificationFilter,
  updateQualificationFilter,
  removeQualificationFilter,
  dateRange,
  setDateRange,
  filteredLeads,
}: {
  search: string;
  setSearch: (v: string) => void;
  viewMode: "kanban" | "table";
  setViewMode: (v: "kanban" | "table") => void;
  filterAdPlatform: string;
  setFilterAdPlatform: (v: string) => void;
  qualificationFilters: QualificationFilter[];
  addQualificationFilter: (question: string) => void;
  updateQualificationFilter: (id: string, value: string) => void;
  removeQualificationFilter: (id: string) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  filteredLeads: Lead[];
}) {
  return (
    <>
      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, phone, email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "kanban" | "table")}>
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex items-center gap-4">
        <AdPlatformFilter value={filterAdPlatform} onChange={setFilterAdPlatform} />
        <QualificationFilters
          filters={qualificationFilters}
          onAdd={addQualificationFilter}
          onUpdate={updateQualificationFilter}
          onRemove={removeQualificationFilter}
        />
        <DateRangeFilter value={dateRange} onChange={(range) => setDateRange(range ?? {})} />
        <div className="ml-auto">
          <ExportButton leads={filteredLeads} />
        </div>
      </div>
    </>
  );
}
