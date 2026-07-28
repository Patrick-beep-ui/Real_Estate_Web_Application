"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, Mail, MessageCircle, Loader2, Maximize2 } from "lucide-react";
import { useLeadMutations } from "@/hooks/leads/useLeadMutations";
import { getAdPlatform } from "@/hooks/leads/useLeadFilters";
import { PIPELINE_STAGES } from "@/lib/leads/types";
import { formatDate, formatSlug } from "@/lib/leads/utils";
import type { Lead } from "@/lib/leads/types";

export function LeadTable({
  sortedLeads,
  setSelectedLead,
  sortConfig,
  requestSort,
  getSortIcon,
  isLoading,
}: {
  sortedLeads: Lead[];
  setSelectedLead: (lead: Lead | null) => void;
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  requestSort: (key: string) => void;
  getSortIcon: (key: string) => React.ReactNode;
  isLoading: boolean;
}) {
  const { updateOfferAmount, updateNotes } = useLeadMutations();
  const [tableEditingOffer, setTableEditingOffer] = useState<{ id: string; value: string } | null>(null);
  const [tableEditingNotes, setTableEditingNotes] = useState<{ id: string; value: string } | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer select-none" onClick={() => requestSort("name")}>
              Name{getSortIcon("name")}
            </TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Address</TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => requestSort("pipeline_stage")}>
              Stage{getSortIcon("pipeline_stage")}
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => requestSort("market_slug")}>
              Market{getSortIcon("market_slug")}
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => requestSort("situation_slug")}>
              Situation{getSortIcon("situation_slug")}
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => requestSort("source")}>Source{getSortIcon("source")}</TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => requestSort("offer_amount")}>
              Offer{getSortIcon("offer_amount")}
            </TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => requestSort("created_at")}>
              Date{getSortIcon("created_at")}
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(sortedLeads || []).map((lead) => (
            <TableRow key={lead.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                <button
                  onClick={() => setSelectedLead(lead)}
                  className="text-left hover:text-primary transition-colors"
                >
                  {lead.name}
                </button>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                    <Phone className="w-3 h-3" /> {lead.phone}
                  </a>
                  {lead.email && (
                    <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                      <Mail className="w-3 h-3" /> {lead.email}
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell className="max-w-[200px]">
                {lead.property_address ? (
                  <span className="text-xs text-muted-foreground truncate block">{lead.property_address}</span>
                ) : (
                  <span className="text-xs text-muted-foreground/50">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`text-xs ${PIPELINE_STAGES.find(s => s.key === (lead.pipeline_stage || "new"))?.color || ""}`}>
                  {lead.pipeline_stage || "new"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                  {formatSlug(lead.market_slug)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                  {formatSlug(lead.situation_slug)}
                </Badge>
              </TableCell>
              <TableCell>
                {(() => {
                  const ad = getAdPlatform(lead);
                  return ad ? (
                    <Badge variant="outline" className={`text-xs ${ad.color}`}>
                      {ad.label}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  );
                })()}
              </TableCell>
              <TableCell>
                {tableEditingOffer?.id === lead.id ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={tableEditingOffer.value}
                      onChange={(e) => setTableEditingOffer({ id: lead.id, value: e.target.value })}
                      className="w-24 h-7 text-xs"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          updateOfferAmount.mutate({ id: lead.id, amount: tableEditingOffer.value ? Number(tableEditingOffer.value) : null });
                          setTableEditingOffer(null);
                        }
                        if (e.key === "Escape") setTableEditingOffer(null);
                      }}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setTableEditingOffer({ id: lead.id, value: lead.offer_amount?.toString() || "" })}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    {lead.offer_amount ? `$${Number(lead.offer_amount).toLocaleString()}` : "—"}
                  </button>
                )}
              </TableCell>
              <TableCell>
                {tableEditingNotes?.id === lead.id ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={tableEditingNotes.value}
                      onChange={(e) => setTableEditingNotes({ id: lead.id, value: e.target.value })}
                      className="w-32 h-7 text-xs"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          updateNotes.mutate({ id: lead.id, notes: tableEditingNotes.value });
                          setTableEditingNotes(null);
                        }
                        if (e.key === "Escape") setTableEditingNotes(null);
                      }}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setTableEditingNotes({ id: lead.id, value: lead.notes || "" })}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors max-w-[150px] truncate block"
                    title={lead.notes || ""}
                  >
                    {lead.notes ? lead.notes.substring(0, 30) + (lead.notes.length > 30 ? "…" : "") : "—"}
                  </button>
                )}
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">{formatDate(lead.created_at)}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <a href={`tel:${lead.phone}`} title="Call">
                    <Phone className="w-4 h-4 text-muted-foreground hover:text-primary" />
                  </a>
                  <a href={`sms:${lead.phone}`} title="SMS">
                    <MessageCircle className="w-4 h-4 text-muted-foreground hover:text-primary" />
                  </a>
                  <button onClick={() => setSelectedLead(lead)} title="View Details">
                    <Maximize2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
