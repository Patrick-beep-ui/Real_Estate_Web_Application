"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Save, RotateCcw, Loader2 } from "lucide-react";
import { AdPlatformFilter } from "@/app/admin/(protected)/leads/AdPlatformFilter";
import { QualificationFilters } from "@/app/admin/(protected)/leads/QualificationFilters";
import { DateRangeFilter } from "@/app/admin/(protected)/leads/DateRangeFilter";
import { ExportButton } from "@/app/admin/(protected)/leads/ExportButton";
import type { QualificationFilter } from "@/app/admin/(protected)/leads/useLeadFilters";
import type { Lead } from "@/lib/leads/types";

type DateRange = { from?: Date; to?: Date };

export function LeadToolbar({
  search,
  setSearch,
  viewMode,
  setViewMode,
  pendingChanges,
  saving,
  onRevert,
  onSave,
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
  pendingChanges: Record<string, unknown>;
  saving: boolean;
  onRevert: () => void;
  onSave: () => void;
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
  const pendingCount = Object.keys(pendingChanges).length;

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

        {pendingCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {pendingCount} pending change{pendingCount !== 1 ? "s" : ""}
            </span>
            <button
              onClick={onRevert}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Revert
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        )}
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
