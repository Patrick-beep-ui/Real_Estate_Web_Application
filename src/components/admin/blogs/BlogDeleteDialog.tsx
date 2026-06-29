"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface BlogDeleteDialogProps {
  postId: string | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function BlogDeleteDialog({ postId, onClose, onConfirm, isPending }: BlogDeleteDialogProps) {
  return (
    <Dialog open={!!postId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Archive Blog Post</DialogTitle>
          <DialogDescription>
            This will set the post to &ldquo;archived&rdquo; status. It will be hidden from the public site but
            the data will be preserved. You can restore it later by changing the status back.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Archive Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
