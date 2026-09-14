"use client";

import { useCallback, useState, type FormEvent } from "react";
import { MapPin, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import AddressAutocomplete from "@/components/leads/AddressAutocomplete";
import type { AddressMeta } from "@/components/leads/AddressAutocomplete";

type TestMode = "manual" | "frontend" | "server";

type TestResult = {
  valid: boolean;
  address_verified?: boolean;
  stage?: "shape" | "geocode";
  error_code?: string;
  error?: string;
  message?: string;
  address?: string;
  address_source?: string;
};

const MODES: { key: TestMode; label: string; description: string }[] = [
  {
    key: "manual",
    label: "Manual entry",
    description: "Type any address by hand — no autocomplete assistance, closest to a pasted address.",
  },
  {
    key: "frontend",
    label: "Frontend autocomplete",
    description: "The native Google Maps JS SDK running in your browser — the normal desktop path.",
  },
  {
    key: "server",
    label: "Server-side autocomplete",
    description: "The /api/places proxy path used when the native script is blocked, e.g. Meta's in-app browser.",
  },
];

const inputClassName =
  "w-full pl-11 pr-4 py-2.5 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

export default function AddressTesterPage() {
  const [mode, setMode] = useState<TestMode>("manual");
  const [address, setAddress] = useState("");
  const [addressSource, setAddressSource] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const switchMode = useCallback((next: TestMode) => {
    setMode(next);
    setAddress("");
    setAddressSource(undefined);
    setResult(null);
    setRequestError(null);
  }, []);

  const runTest = useCallback(async (addr: string, source?: string) => {
    const trimmed = addr.trim();
    if (!trimmed) return;

    setTesting(true);
    setRequestError(null);
    setResult(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setRequestError("Your admin session has expired — please refresh and sign in again.");
        return;
      }

      const response = await fetch("/api/places/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ address: trimmed, address_source: source }),
      });

      const body = await response.json();

      if (!response.ok) {
        setRequestError(body?.error || `Request failed (${response.status})`);
        return;
      }

      setResult(body as TestResult);
    } catch {
      setRequestError("Couldn't reach the address test endpoint. Please try again.");
    } finally {
      setTesting(false);
    }
  }, []);

  const handleAutocompleteChange = useCallback((value: string, meta: AddressMeta) => {
    setAddress(value);
    setAddressSource(meta.source);
  }, []);

  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    void runTest(address);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Address Tester</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Runs any address through the real lead-submission validator — the same
          shape check and Google Geocoding call used by <code>/api/leads/submit</code>
          {" "}— without creating a lead, syncing to GHL, or firing any notifications.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => switchMode(m.key)}
            className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
              mode === m.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:bg-muted/50"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground -mt-3">
        {MODES.find((m) => m.key === mode)?.description}
      </p>

      {mode === "manual" && (
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter any address to test"
              className={inputClassName}
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={testing || !address.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {testing && <Loader2 className="w-4 h-4 animate-spin" />}
            {testing ? "Testing…" : "Test address"}
          </button>
        </form>
      )}

      {(mode === "frontend" || mode === "server") && (
        <div className="space-y-3">
          <AddressAutocomplete
            key={mode}
            id={`address-tester-${mode}`}
            value={address}
            onChange={handleAutocompleteChange}
            placeholder="Start typing an address…"
            className={inputClassName}
            forceMode={mode === "server" ? "proxy" : "native"}
          />
          <button
            type="button"
            onClick={() => runTest(address, addressSource)}
            disabled={testing || !address.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {testing && <Loader2 className="w-4 h-4 animate-spin" />}
            {testing ? "Testing…" : "Test address"}
          </button>
        </div>
      )}

      {requestError && <p className="text-sm text-destructive">{requestError}</p>}

      {result && (
        <div
          className={`rounded-md border p-4 space-y-2 ${
            result.valid ? "border-green-500/50 bg-green-500/5" : "border-destructive/50 bg-destructive/5"
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {result.valid ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span>Valid — would pass the validator</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-destructive" />
                <span>Rejected — would be blocked</span>
              </>
            )}
          </div>
          <p className="text-sm text-muted-foreground break-words">Tested address: {result.address}</p>
          {result.stage && (
            <p className="text-xs text-muted-foreground">
              Failed at:{" "}
              {result.stage === "shape"
                ? "shape check (before any Google API call)"
                : "Google Geocoding verification"}
            </p>
          )}
          {result.error_code && (
            <p className="text-xs text-muted-foreground">Error code: {result.error_code}</p>
          )}
          {result.message && <p className="text-sm">{result.message}</p>}
        </div>
      )}
    </div>
  );
}
