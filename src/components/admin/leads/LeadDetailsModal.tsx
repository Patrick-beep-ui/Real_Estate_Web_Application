"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, DollarSign, StickyNote, Save, X, MessageCircle } from "lucide-react";
import { useState } from "react";

type Lead = {
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
};

type Props = {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOfferSave: (amount: number | null) => void;
  onNotesSave: (notes: string) => void;
  formatDate: (d: string) => string;
  formatSlug: (s: string) => string;
};

const statusColors: Record<string, string> = {
  new: "bg-yellow-500/20 border-yellow-500/40 text-yellow-400",
  contacted: "bg-blue-500/20 border-blue-500/40 text-blue-400",
  qualified: "bg-purple-500/20 border-purple-500/40 text-purple-400",
  closed: "bg-green-500/20 border-green-500/40 text-green-400",
  lost: "bg-red-500/20 border-red-500/40 text-red-400",
};

export function LeadDetailsModal({
  lead,
  open,
  onOpenChange,
  onOfferSave,
  onNotesSave,
  formatDate,
  formatSlug,
}: Props) {
  const [editingOffer, setEditingOffer] = useState(false);
  const [offerVal, setOfferVal] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [notesVal, setNotesVal] = useState("");

  if (!lead) return null;

  const handleOfferSave = () => {
    try {
      onOfferSave(offerVal ? Number(offerVal) : null);
      setEditingOffer(false);
    } catch (err) {
      console.error("Offer save error:", err);
    }
  };

  const handleNotesSave = () => {
    try {
      onNotesSave(notesVal);
      setShowNotes(false);
    } catch (err) {
      console.error("Notes save error:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-foreground">
                {lead.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Created {formatDate(lead.created_at || "")}
              </DialogDescription>
            </div>
            {/** 
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
            */}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Contact Information
            </h3>
            <div className="space-y-2">
              <a
                href={`tel:${lead.phone}`}
                className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
              >
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-base">{lead.phone}</span>
              </a>
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-base">{lead.email}</span>
                </a>
              )}
              {lead.property_address && (
                <div className="flex items-start gap-2 text-foreground">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-base">{lead.property_address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex gap-2">
            <Badge
              variant="outline"
              className={`text-sm px-3 py-1 ${statusColors[lead.pipeline_stage || "new"] || statusColors.new}`}
            >
              {lead.pipeline_stage || "new"}
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1 border-border text-muted-foreground">
              {formatSlug(lead.market_slug)}
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1 border-border text-muted-foreground">
              {formatSlug(lead.situation_slug)}
            </Badge>
          </div>

          {/* Offer Amount */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Offer Amount
            </h3>
            {editingOffer ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={offerVal}
                  onChange={(e) => setOfferVal(e.target.value)}
                  placeholder="Enter offer amount"
                  className="text-base"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleOfferSave();
                    if (e.key === "Escape") setEditingOffer(false);
                  }}
                />
                <Button size="sm" onClick={handleOfferSave}>
                  <Save className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingOffer(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setOfferVal(lead.offer_amount?.toString() || "");
                  setEditingOffer(true);
                }}
                className="text-base text-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                {lead.offer_amount
                  ? `$${Number(lead.offer_amount).toLocaleString()}`
                  : "Add offer amount"}
              </button>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Notes
            </h3>
            {showNotes ? (
              <div className="space-y-2">
                <Textarea
                  value={notesVal}
                  onChange={(e) => setNotesVal(e.target.value)}
                  placeholder="Add notes about this lead..."
                  className="min-h-[120px] text-base"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleNotesSave}>
                    <Save className="w-4 h-4 mr-1" />
                    Save Notes
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowNotes(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setNotesVal(lead.notes || "");
                  setShowNotes(true);
                }}
                className="text-base text-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <StickyNote className="w-4 h-4" />
                {lead.notes
                  ? lead.notes.substring(0, 100) + (lead.notes.length > 100 ? "..." : "")
                  : "Add notes"}
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Quick Actions
            </h3>
            <div className="flex gap-3">
              <a href={`tel:${lead.phone}`}>
                <Button className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Call
                </Button>
              </a>
              <a href={`sms:${lead.phone}`}>
                <Button variant="outline" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Send SMS
                </Button>
              </a>
              <Button
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
