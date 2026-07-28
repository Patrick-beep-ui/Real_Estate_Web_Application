"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { GripVertical, Phone, Mail, MapPin, DollarSign, StickyNote, Save, MessageCircle, Maximize2 } from "lucide-react";
import { getAdPlatform } from "@/hooks/leads/useLeadFilters";
import { formatDate, formatSlug } from "@/lib/leads/utils";
import type { Lead } from "@/lib/leads/types";

export function LeadCard({
  lead,
  onDragStart,
  onOfferSave,
  onNotesSave,
  onViewDetails,
}: {
  lead: Lead;
  onDragStart: () => void;
  onOfferSave: (amount: number | null) => void;
  onNotesSave: (notes: string) => void;
  onViewDetails?: () => void;
}) {
  const [editingOffer, setEditingOffer] = useState(false);
  const [offerVal, setOfferVal] = useState(lead.offer_amount?.toString() || "");
  const [showNotes, setShowNotes] = useState(false);
  const [notesVal, setNotesVal] = useState(lead.notes || "");

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="rounded-lg border border-border bg-background p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center gap-1">
          <GripVertical className="w-3 h-3 text-muted-foreground/50" />
          <span className="text-sm font-semibold text-foreground truncate max-w-[100px]">{lead.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground">{formatDate(lead.created_at)}</span>
          {onViewDetails && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
              className="p-0.5 rounded hover:bg-muted transition-colors"
              title="View full details"
            >
              <Maximize2 className="w-5 h-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1 mb-2">
        <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
          <Phone className="w-3 h-3" /> {lead.phone}
        </a>
        {lead.email && (
          <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors truncate">
            <Mail className="w-3 h-3" /> {lead.email}
          </a>
        )}
        {lead.property_address && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{lead.property_address}</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 mb-2">
        <Badge variant="outline" className="text-[10px] border-border text-muted-foreground px-1.5 py-0">
          {formatSlug(lead.market_slug)}
        </Badge>
        <Badge variant="outline" className="text-[10px] border-border text-muted-foreground px-1.5 py-0">
          {formatSlug(lead.situation_slug)}
        </Badge>
        {(() => {
          const ad = getAdPlatform(lead);
          return ad ? (
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${ad.color}`}>
              {ad.label}
            </Badge>
          ) : null;
        })()}
      </div>

      {editingOffer ? (
        <div className="flex gap-1">
          <input
            type="number"
            value={offerVal}
            onChange={(e) => setOfferVal(e.target.value)}
            placeholder="Offer $"
            className="flex-1 h-6 text-xs rounded border border-input bg-background px-2 text-foreground"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onOfferSave(offerVal ? Number(offerVal) : null);
                setEditingOffer(false);
              }
              if (e.key === "Escape") setEditingOffer(false);
            }}
          />
        </div>
      ) : (
        <button
          onClick={() => setEditingOffer(true)}
          className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          <DollarSign className="w-3 h-3" />
          {lead.offer_amount ? `$${Number(lead.offer_amount).toLocaleString()}` : "Add offer"}
        </button>
      )}

      {showNotes ? (
        <div className="mt-2 space-y-1">
          <Textarea
            value={notesVal}
            onChange={(e) => setNotesVal(e.target.value)}
            placeholder="Add notes about this lead…"
            className="text-xs min-h-[60px] resize-none"
            autoFocus
          />
          <div className="flex gap-1">
            <button
              onClick={() => { onNotesSave(notesVal); setShowNotes(false); }}
              className="text-[10px] text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5"
            >
              <Save className="w-3 h-3" /> Save
            </button>
            <button
              onClick={() => setShowNotes(false)}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowNotes(true)}
          className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mt-1"
        >
          <StickyNote className="w-3 h-3" />
          {lead.notes ? lead.notes.substring(0, 30) + (lead.notes.length > 30 ? "…" : "") : "Add notes"}
        </button>
      )}

      <div className="flex gap-1.5 mt-2 pt-2 border-t border-border">
        <a href={`tel:${lead.phone}`} className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5">
          <Phone className="w-3 h-3" /> Call
        </a>
        <a href={`sms:${lead.phone}`} className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5">
          <MessageCircle className="w-3 h-3" /> SMS
        </a>
      </div>
    </div>
  );
}
