"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LeadErrorClearDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resolvedCount: number;
  isPending: boolean;
  onConfirm: () => void;
}

export function LeadErrorClearDialog({
  open, onOpenChange, resolvedCount, isPending, onConfirm,
}: LeadErrorClearDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear Resolved Errors</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all {resolvedCount} resolved error records. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90 cursor-pointer"
          >
            {isPending ? "Clearing..." : "Clear All"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
