"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useLeadFilters } from "@/hooks/leads/useLeadFilters";
import { useLeadSort } from "@/hooks/leads/useLeadSort";
import { useLeadStats } from "@/hooks/leads/useLeadStats";
import { LeadStatsCards } from "@/components/admin/leads/LeadStatsCards";
import { LeadToolbar } from "@/components/admin/leads/LeadToolbar";
import { LeadKanbanBoard } from "@/components/admin/leads/LeadKanbanBoard";
import { LeadTable } from "@/components/admin/leads/LeadTable";
import { LeadDetailsModal } from "@/components/admin/leads/LeadDetailsModal";
import { useLeadMutations } from "@/hooks/leads/useLeadMutations";
import { formatDate, formatSlug } from "@/lib/leads/utils";
import type { Lead } from "@/lib/leads/types";

const AdminLeads = () => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  const { data: leads, isLoading } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Array<Lead>;
    },
  });

  const filters = useLeadFilters(leads);
  const { sortedLeads, sortConfig, requestSort, getSortIcon } = useLeadSort(filters.filteredLeads);
  const stats = useLeadStats(filters.filteredLeads, leads);
  const { deleteLead } = useLeadMutations();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Lead Pipeline</h1>

      <LeadStatsCards stats={stats} />

      <LeadToolbar
        search={filters.search}
        setSearch={filters.setSearch}
        viewMode={viewMode}
        setViewMode={setViewMode}
        filterAdPlatform={filters.filterAdPlatform}
        setFilterAdPlatform={filters.setFilterAdPlatform}
        qualificationFilters={filters.qualificationFilters}
        addQualificationFilter={filters.addQualificationFilter}
        updateQualificationFilter={filters.updateQualificationFilter}
        removeQualificationFilter={filters.removeQualificationFilter}
        dateRange={filters.dateRange}
        setDateRange={filters.setDateRange}
        filteredLeads={filters.filteredLeads}
      />

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "kanban" | "table")}>
        <TabsContent value="kanban">
          <LeadKanbanBoard
            sortedLeads={sortedLeads}
            setSelectedLead={setSelectedLead}
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="table">
          <LeadTable
            sortedLeads={sortedLeads}
            setSelectedLead={setSelectedLead}
            sortConfig={sortConfig}
            requestSort={requestSort}
            getSortIcon={getSortIcon}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          open={!!selectedLead}
          onOpenChange={(open) => !open && setSelectedLead(null)}
          onOfferSave={(amount) => {}}
          onNotesSave={(notes) => {}}
          onDelete={() => deleteLead.mutate(selectedLead.id)}
          formatDate={formatDate}
          formatSlug={formatSlug}
        />
      )}
    </div>
  );
};

export default AdminLeads;
