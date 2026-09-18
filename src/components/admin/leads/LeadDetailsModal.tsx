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
import { Phone, Mail, MapPin, DollarSign, StickyNote, Save, X, MessageCircle, Trash2, Clock, Home, CalendarCheck, Globe } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { resolveSellerLocationLabel } from "@/lib/leads/market-tag";
import type { Lead } from "@/lib/leads/types";

type Props = {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOfferSave: (amount: number | null) => void;
  onNotesSave: (notes: string) => void;
  onDelete: () => void;
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
  onDelete,
  formatDate,
  formatSlug,
}: Props) {
  const [editingOffer, setEditingOffer] = useState(false);
  const [offerVal, setOfferVal] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [notesVal, setNotesVal] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmName, setConfirmName] = useState("");

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

  const handleDelete = () => {
    if (confirmName === lead?.name) {
      onDelete();
      setShowDeleteDialog(false);
      setConfirmName("");
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
              {(lead.tz_browser || lead.tz_ip) && (
                <div className="flex items-center gap-2 text-foreground">
                  <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-base">{lead.tz_browser ?? lead.tz_ip}</span>
                </div>
              )}
              {lead.seller_state && (
                <div className="flex items-center gap-2 text-foreground">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-base">
                    Seller Location: {resolveSellerLocationLabel(lead.seller_state, lead.seller_country, lead.source)}
                  </span>
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
               {(lead.gclid || lead.gbraid || lead.wbraid) && <Badge variant="outline" className="text-[14px] bg-blue-500/20 border-blue-500/40 text-green-400">Google Ads</Badge>}
              {(lead.fbclid || lead.fb_adset_id || lead.fb_campaign_id) && <Badge variant="outline" className="text-[14px] bg-indigo-500/20 border-indigo-500/40 text-indigo-400">Meta Ads</Badge>}
              {lead.msclkid && <Badge variant="outline" className="text-[14px] bg-orange-500/20 border-orange-500/40 text-orange-400">Microsoft Ads</Badge>}
          </div>

          {/* Qualification */}
          {(lead.timeline_to_sell || lead.listed_with_agent || lead.property_age) && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Qualification
              </h3>
              <div className="space-y-1 text-sm">
                {lead.timeline_to_sell && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground min-w-[120px]">Timeline:</span>
                    <span>{lead.timeline_to_sell}</span>
                  </div>
                )}
                {lead.listed_with_agent && (
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground min-w-[120px]">Listed:</span>
                    <span>{lead.listed_with_agent}</span>
                  </div>
                )}
                {lead.property_age && (
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground min-w-[120px]">Property Age:</span>
                    <span>{lead.property_age}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Property Value */}
          {(lead.market_price || lead.lowest_price) && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Property Value
              </h3>
              <div className="space-y-1 text-sm">
                {lead.market_price != null && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground min-w-[120px]">Market Value:</span>
                    <span>${lead.market_price.toLocaleString("en-US")}</span>
                  </div>
                )}
                {lead.lowest_price != null && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground min-w-[120px]">Lowest Price:</span>
                    <span>${lead.lowest_price.toLocaleString("en-US")}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Traffic Source */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Traffic Source
            </h3>
            <div className="space-y-1 text-sm">
               {lead.utm_source || lead.gclid || lead.gbraid || lead.wbraid || lead.fbclid || lead.msclkid || lead.utm_id || lead.fb_adset_id || lead.fb_campaign_id ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground min-w-[80px]">Source:</span>
                     <span>{lead.utm_source || (lead.gclid || lead.gbraid || lead.wbraid ? "adwords" : (lead.fbclid || lead.fb_adset_id || lead.fb_campaign_id) ? "facebook" : lead.msclkid ? "microsoft" : "—")}</span>

                  </div>
                  {lead.utm_medium && <div className="flex items-center gap-2"><span className="text-muted-foreground min-w-[80px]">Medium:</span><span>{lead.utm_medium}</span></div>}
                  {lead.utm_campaign && <div className="flex items-center gap-2"><span className="text-muted-foreground min-w-[80px]">Campaign:</span><span>{lead.utm_campaign}</span></div>}
                   {lead.utm_content && <div className="flex items-center gap-2"><span className="text-muted-foreground min-w-[80px]">Ad Content:</span><span>{lead.utm_content}</span></div>}
                   {lead.utm_term && <div className="flex items-center gap-2"><span className="text-muted-foreground min-w-[80px]">Keyword:</span><span>{lead.utm_term}</span></div>}
                   {lead.utm_id && <div className="flex items-center gap-2"><span className="text-muted-foreground min-w-[80px]">Ad ID:</span><span className="break-all">{lead.utm_id}</span></div>}
                   {lead.gclid && <div className="flex items-center gap-2"><span className="text-muted-foreground min-w-[80px]">GCLID:</span><span className="break-all">{lead.gclid}</span></div>}
                   {lead.gbraid && <div className="flex items-center gap-2"><span className="text-muted-foreground min-w-[80px]">GBRAID:</span><span className="break-all">{lead.gbraid}</span></div>}
                   {lead.wbraid && <div className="flex items-center gap-2"><span className="text-muted-foreground min-w-[80px]">WBRAID:</span><span className="break-all">{lead.wbraid}</span></div>}
                   {lead.fb_adset_id && <div className="flex items-center gap-2"><span className="text-muted-foreground min-w-[80px]">Ad Set ID:</span><span className="break-all">{lead.fb_adset_id}</span></div>}
                   {lead.fb_campaign_id && <div className="flex items-center gap-2"><span className="text-muted-foreground min-w-[80px]">Campaign ID:</span><span className="break-all">{lead.fb_campaign_id}</span></div>}
                   {lead.fbclid && <div className="flex items-center gap-2"><span className="text-muted-foreground min-w-[80px]">FBCLID:</span><span className="break-all">{lead.fbclid}</span></div>}
                   {lead.msclkid && <div className="flex items-center gap-2"><span className="text-muted-foreground min-w-[80px]">MSCLKID:</span><span className="break-all">{lead.msclkid}</span></div>}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground min-w-[80px]">Source:</span>
                  <span>Direct / Organic</span>
                </div>
              )}
            </div>
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
              <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
                setShowDeleteDialog(open);
                if (!open) setConfirmName("");
              }}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="flex items-center gap-2"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Lead
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the lead for <strong>{lead.name}</strong>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <label className="text-sm text-muted-foreground">
                      Type the lead's name to confirm:
                    </label>
                    <Input
                      value={confirmName}
                      onChange={(e) => setConfirmName(e.target.value)}
                      placeholder={lead.name}
                      className="mt-2"
                      autoFocus
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => {
                      setShowDeleteDialog(false);
                      setConfirmName("");
                    }}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={confirmName !== lead.name}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
