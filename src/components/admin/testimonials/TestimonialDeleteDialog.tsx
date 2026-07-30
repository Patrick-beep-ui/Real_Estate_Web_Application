"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Props {
  testimonialId: string | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function TestimonialDeleteDialog({ testimonialId, onClose, onConfirm, isPending }: Props) {
  return (
    <Dialog open={!!testimonialId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Archive Testimonial</DialogTitle>
          <DialogDescription>
            This will set the testimonial to &ldquo;archived&rdquo; status. It will be hidden from the public site
            but the data will be preserved. You can restore it later by changing the status back.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Archive
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
