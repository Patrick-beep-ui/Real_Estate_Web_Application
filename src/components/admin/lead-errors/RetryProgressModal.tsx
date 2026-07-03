"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, MinusCircle } from "lucide-react";

type StepState = "pending" | "in-progress" | "success" | "failed" | "skipped";

export type RetryResult = {
  success: boolean;
  dbSuccess: boolean;
  ghlSuccess: boolean;
  ghlConfigured: boolean;
  duplicate: boolean;
  error: { code?: string; message?: string } | null;
  ghlError: { message?: string } | null;
  warnings: string[];
  retryCount: number;
  retry_batch_id?: string;
  beforeGhlSync?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  leadName: string;
  result: RetryResult | null;
  apiError?: string | null;
};

function StepIcon({ state }: { state: StepState }) {
  switch (state) {
    case "pending":
      return <div className="w-5 h-5 rounded-full border-2 border-border" />;
    case "in-progress":
      return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
    case "success":
      return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    case "failed":
      return <XCircle className="w-5 h-5 text-destructive" />;
    case "skipped":
      return <MinusCircle className="w-5 h-5 text-muted-foreground" />;
  }
}

function StepLabel({ state, result }: { state: StepState; result: RetryResult | null }) {
  switch (state) {
    case "pending":
      return <p className="text-xs text-muted-foreground mt-0.5">Waiting for database insert...</p>;
    case "in-progress":
      return <p className="text-xs text-muted-foreground mt-0.5 animate-pulse">Processing...</p>;
    case "success":
      return (
        <p className="text-xs text-muted-foreground mt-0.5">
          {result?.duplicate ? "Duplicate — lead already exists in DB" : "Lead saved to database"}
        </p>
      );
    case "failed":
      return (
        <p className="text-xs text-destructive mt-0.5">
          {result?.error?.message || "Failed to save to database"}
        </p>
      );
    case "skipped":
      return (
        <p className="text-xs text-muted-foreground mt-0.5">
          {!result?.dbSuccess ? "Skipped — DB insert failed" : "GHL not configured, skipped"}
        </p>
      );
  }
}

function GhlStepLabel({ state, result }: { state: StepState; result: RetryResult | null }) {
  switch (state) {
    case "pending":
      return <p className="text-xs text-muted-foreground mt-0.5">Waiting for database insert...</p>;
    case "in-progress":
      return <p className="text-xs text-muted-foreground mt-0.5 animate-pulse">Syncing to GHL...</p>;
    case "success":
      return <p className="text-xs text-muted-foreground mt-0.5">Synced to GHL successfully</p>;
    case "failed":
      return (
        <p className="text-xs text-destructive mt-0.5">
          {result?.ghlError?.message || "GHL sync failed"}
        </p>
      );
    case "skipped":
      return <p className="text-xs text-muted-foreground mt-0.5">GHL not configured, skipped</p>;
  }
}

export function RetryProgressModal({ open, onClose, leadName, result, apiError }: Props) {
  const [step1, setStep1] = useState<StepState>("in-progress");
  const [step2, setStep2] = useState<StepState>("pending");
  const [showSummary, setShowSummary] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    if (!open) {
      clearTimers();
      setStep1("in-progress");
      setStep2("pending");
      setShowSummary(false);
      return;
    }

    let active = true;
    const timer = (fn: () => void, ms: number) => {
      const t = setTimeout(() => { if (active) fn(); }, ms);
      timersRef.current.push(t);
    };

    if (apiError) {
      setStep1("failed");
      timer(() => {
        setStep2("failed");
        timer(() => setShowSummary(true), 500);
      }, 800);
    } else if (result) {
      setStep1(result.dbSuccess ? "success" : "failed");

      timer(() => {
        if (!active) return;
        setStep2("in-progress");

        timer(() => {
          if (!active) return;
          if (!result.ghlConfigured) {
            setStep2("skipped");
          } else if (result.ghlSuccess) {
            setStep2("success");
          } else {
            setStep2("failed");
          }
          timer(() => setShowSummary(true), 500);
        }, 500);
      }, 1000);
    }

    return () => {
      active = false;
      clearTimers();
    };
  }, [open, result, apiError, clearTimers]);

  const summaryContent = () => {
    if (apiError) return { text: `Retry failed: ${apiError}`, type: "failure" as const };
    if (!result) return { text: "", type: "success" as const };

    if (result.success) {
      return { text: `${leadName} was successfully saved to the database and synced to GHL.`, type: "success" as const };
    }
    if (result.dbSuccess && !result.ghlSuccess) {
      return { text: `${leadName} was saved to the database, but GHL sync failed: ${result.ghlError?.message || "Unknown GHL error"}`, type: "partial" as const };
    }
    if (!result.dbSuccess && result.ghlSuccess) {
      return { text: `${leadName} was synced to GHL, but the database insert failed: ${result.error?.message || "Unknown DB error"}`, type: "partial" as const };
    }
    return { text: `${leadName} failed to re-submit: ${result.error?.message || result.ghlError?.message || "Unknown error"}`, type: "failure" as const };
  };

  const summary = summaryContent();
  const hideClose = !showSummary;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && showSummary) onClose(); }}>
      <DialogContent
        className={`sm:max-w-md${hideClose ? " [&>button.absolute]:hidden" : ""}`}
        onPointerDownOutside={(e) => { if (hideClose) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (hideClose) e.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg">Retry Progress</DialogTitle>
        </DialogHeader>

        <div className="relative py-6">
          <div className="absolute left-[9px] top-3 bottom-3 w-0.5 bg-border" />

          <div className="flex gap-3 pb-8">
            <div className="shrink-0">
              <StepIcon state={step1} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Database Insert</p>
              <StepLabel state={step1} result={result} />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="shrink-0">
              <StepIcon state={step2} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">GHL Sync</p>
              <GhlStepLabel state={step2} result={result} />
            </div>
          </div>

          {showSummary && (
            <div
              className={`mt-6 p-3 rounded-md text-sm font-medium text-center transition-all duration-500 animate-in fade-in slide-in-from-bottom-2 ${
                summary.type === "success"
                  ? "bg-green-500/10 text-green-400 border border-green-500/30"
                  : summary.type === "partial"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  : "bg-red-500/10 text-red-400 border border-red-500/30"
              }`}
            >
              {summary.text}
            </div>
          )}
        </div>

        {showSummary && (
          <div className="flex justify-end pt-2 animate-in fade-in slide-in-from-bottom-2">
            <Button onClick={onClose} variant="default">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
