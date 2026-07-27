"use client";

import { RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LeadError } from "@/hooks/useLeadErrors";

interface LeadErrorEditDialogProps {
  error: LeadError | null;
  editPayload: Record<string, string>;
  onPayloadChange: (payload: Record<string, string>) => void;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

const FIELDS = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "property_address", label: "Property Address" },
  { key: "market_slug", label: "Market" },
  { key: "situation_slug", label: "Situation" },
  { key: "source", label: "Source" },
];

export function LeadErrorEditDialog({
  error, editPayload, onPayloadChange,
  onClose, onConfirm, isPending,
}: LeadErrorEditDialogProps) {
  return (
    <Dialog open={!!error} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit & Retry</DialogTitle>
          <DialogDescription>
            Modify the lead data before retrying. Clear optional fields (email, address) by leaving them empty. Required fields (name, phone) keep original values if left empty.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          {FIELDS.map(({ key, label }) => (
            <div className="grid gap-1.5" key={key}>
              <Label htmlFor={`edit-${key}`} className="text-xs">{label}</Label>
              <Input
                id={`edit-${key}`}
                value={editPayload[key] || ""}
                onChange={(e) => onPayloadChange({ ...editPayload, [key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RotateCcw className="w-3 h-3 mr-1" />}
            Retry with Edits
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
