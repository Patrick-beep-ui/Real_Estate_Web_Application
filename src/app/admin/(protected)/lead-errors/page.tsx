"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle, Loader2, RotateCcw, ChevronDown, ChevronRight,
  Database, Globe, Wifi, Search, CheckCircle2, Trash2,
} from "lucide-react";
import { classifyError, getRetryRiskLabel, getRetryAdvice } from "@/lib/leads/error-classification";

type LeadError = {
  id: string;
  created_at: string;
  email: string | null;
  error_code: string | null;
  error_details: string | null;
  error_message: string | null;
  last_retry_at: string | null;
  market_slug: string | null;
  name: string | null;
  payload: Record<string, unknown> | null;
  phone: string | null;
  property_address: string | null;
  resolved: boolean;
  resolved_at: string | null;
  retry_count: number;
  situation_slug: string | null;
  source: string | null;
};

type ErrorFilter = "all" | "db" | "ghl_api" | "ghl_fetch";
type ResolvedFilter = "active" | "resolved" | "all";

const AdminLeadErrors = () => {
  const [filter, setFilter] = useState<ErrorFilter>("all");
  const [resolvedFilter, setResolvedFilter] = useState<ResolvedFilter>("active");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [confirmRetryError, setConfirmRetryError] = useState<LeadError | null>(null);
  const [editingError, setEditingError] = useState<LeadError | null>(null);
  const [editPayload, setEditPayload] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [clearResolvedOpen, setClearResolvedOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: errors, isLoading } = useQuery({
    queryKey: ["admin-lead-errors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_errors")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Array<LeadError>;
    },
  });

  const retryMutation = useMutation({
    mutationFn: async ({ errorId, modifiedPayload }: { errorId: string; modifiedPayload?: Record<string, unknown> }) => {
      const res = await fetch("/api/leads/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ errorId, modifiedPayload }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Retry failed" }));
        throw new Error(err.error || "Retry failed");
      }
      return res.json();
    },
    onSuccess: (result, vars) => {
      const err = errors?.find((e) => e.id === vars.errorId);
      queryClient.invalidateQueries({ queryKey: ["admin-lead-errors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics-leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview-stats"] });
      if (result.resolved) {
        toast({ title: "Retry successful", description: `${err?.name || "Lead"} re-submitted and resolved.` });
      } else {
        toast({
          variant: "destructive",
          title: "Retry partial",
          description: `${err?.name || "Lead"} saved to DB but ${result.warnings?.join(", ") || "had issues"}.`,
        });
      }
      setConfirmRetryError(null);
      setEditingError(null);
    },
    onError: (_error, vars) => {
      const err = errors?.find((e) => e.id === vars.errorId);
      queryClient.invalidateQueries({ queryKey: ["admin-lead-errors"] });
      toast({
        variant: "destructive",
        title: "Retry failed",
        description: `${err?.name || "Lead"} retry failed. Error record updated.`,
      });
      setConfirmRetryError(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lead_errors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lead-errors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview-stats"] });
      toast({ title: "Error record deleted" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Delete failed", description: (error as Error).message });
    },
  });

  const clearResolvedMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("lead_errors").delete().eq("resolved", true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-lead-errors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview-stats"] });
      setClearResolvedOpen(false);
      toast({ title: "Resolved errors cleared" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Clear failed", description: (error as Error).message });
    },
  });

  const filtered = useMemo(() => {
    if (!errors) return [];
    let result = errors;
    if (resolvedFilter === "active") result = result.filter((e) => !e.resolved);
    else if (resolvedFilter === "resolved") result = result.filter((e) => e.resolved);
    if (filter === "all") return result;
    return result.filter((e) => {
      const code = e.error_code || "";
      switch (filter) {
        case "db": return !code.startsWith("GHL");
        case "ghl_api": return code === "GHL_ERROR";
        case "ghl_fetch": return code === "GHL_FETCH_ERROR";
        default: return true;
      }
    });
  }, [errors, filter, resolvedFilter]);

  const stats = useMemo(() => {
    if (!errors) return { total: 0, db: 0, ghlApi: 0, ghlFetch: 0, other: 0, resolved: 0, active: 0 };
    const total = errors.length;
    const resolved = errors.filter((e) => e.resolved).length;
    const active = total - resolved;
    const db = errors.filter((e) => !(e.error_code || "").startsWith("GHL") && !e.resolved).length;
    const ghlApi = errors.filter((e) => e.error_code === "GHL_ERROR" && !e.resolved).length;
    const ghlFetch = errors.filter((e) => e.error_code === "GHL_FETCH_ERROR" && !e.resolved).length;
    const other = active - db - ghlApi - ghlFetch;
    return { total, db, ghlApi, ghlFetch, other, resolved, active };
  }, [errors]);

  const resolvedCount = useMemo(() => {
    if (!errors) return 0;
    return errors.filter((e) => e.resolved).length;
  }, [errors]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const formatSlug = (slug: string | null) =>
    slug ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";

  const getErrorBadge = (code: string | null) => {
    if (!code) return <Badge variant="outline" className="text-xs border-border text-muted-foreground">UNKNOWN</Badge>;
    if (code.startsWith("GHL")) {
      if (code === "GHL_FETCH_ERROR") return <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-400 bg-amber-500/10">{code}</Badge>;
      return <Badge variant="outline" className="text-xs border-orange-500/40 text-orange-400 bg-orange-500/10">{code}</Badge>;
    }
    return <Badge variant="outline" className="text-xs border-red-500/40 text-red-400 bg-red-500/10">{code}</Badge>;
  };

  const getRiskBadge = (code: string | null) => {
    const cat = classifyError(code);
    if (cat === "transient") return <Badge className="text-xs bg-green-500/10 text-green-400 border-green-500/30">Transient</Badge>;
    if (cat === "structural") return <Badge className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">Structural</Badge>;
    return <Badge variant="outline" className="text-xs text-muted-foreground">Unknown</Badge>;
  };

  const formatErrorDetails = (details: string | null) => {
    if (!details) return null;
    try {
      const parsed = JSON.parse(details);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return details;
    }
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!filtered) return;
    if (selectedIds.size === visibleErrorIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleErrorIds));
    }
  };

  const visibleErrorIds = useMemo(() => filtered.map((e) => e.id), [filtered]);

  const openEditRetry = useCallback((err: LeadError) => {
    const p = (err.payload || {}) as Record<string, unknown>;
    setEditPayload({
      name: String(p.name || err.name || ""),
      phone: String(p.phone || err.phone || ""),
      email: String(p.email || err.email || ""),
      property_address: String(p.property_address || err.property_address || ""),
      market_slug: String(p.market_slug || err.market_slug || ""),
      situation_slug: String(p.situation_slug || err.situation_slug || ""),
      source: String(p.source || err.source || ""),
    });
    setEditingError(err);
  }, []);

  const handleEditedRetry = () => {
    if (!editingError) return;
    const modifiedPayload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(editPayload)) {
      if (value) modifiedPayload[key] = value;
    }
    retryMutation.mutate({ errorId: editingError.id, modifiedPayload });
  };

  const handleBulkRetry = () => {
    const selected = filtered.filter((e) => selectedIds.has(e.id) && !e.resolved);
    for (const err of selected) {
      retryMutation.mutate({ errorId: err.id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Lead Errors</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-md bg-muted p-0.5">
            <button
              onClick={() => setResolvedFilter("active")}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                resolvedFilter === "active" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setResolvedFilter("resolved")}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                resolvedFilter === "resolved" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Resolved
            </button>
            <button
              onClick={() => setResolvedFilter("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                resolvedFilter === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as ErrorFilter)}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs text-muted-foreground"
          >
            <option value="all">All Errors</option>
            <option value="db">Database Errors</option>
            <option value="ghl_api">GHL API Errors</option>
            <option value="ghl_fetch">GHL Network Errors</option>
          </select>
          {resolvedCount > 0 && resolvedFilter === "resolved" && (
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setClearResolvedOpen(true)}>
              <Trash2 className="w-3 h-3" />
              Clear Resolved
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatCard label="Total Errors" value={stats.total.toString()} icon={<AlertTriangle className="w-4 h-4 text-destructive" />} />
        <StatCard label="Active" value={stats.active.toString()} icon={<AlertTriangle className="w-4 h-4 text-destructive" />} />
        <StatCard label="Database" value={stats.db.toString()} icon={<Database className="w-4 h-4 text-red-400" />} />
        <StatCard label="GHL API" value={stats.ghlApi.toString()} icon={<Globe className="w-4 h-4 text-orange-400" />} />
        <StatCard label="GHL Network" value={stats.ghlFetch.toString()} icon={<Wifi className="w-4 h-4 text-amber-400" />} />
        <StatCard label="Resolved" value={stats.resolved.toString()} icon={<CheckCircle2 className="w-4 h-4 text-green-400" />} />
      </div>

      {resolvedFilter !== "resolved" && filtered.some((e) => !e.resolved && selectedIds.size > 0) && (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="text-xs gap-1" onClick={handleBulkRetry} disabled={retryMutation.isPending}>
            {retryMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
            Retry Selected ({selectedIds.size})
          </Button>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedIds(new Set())}>
            Clear selection
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <AlertTriangle className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">No error records found</p>
        </div>
      ) : (
        <div className="rounded border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  {resolvedFilter !== "resolved" && (
                    <Checkbox
                      checked={selectedIds.size === visibleErrorIds.length && visibleErrorIds.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  )}
                </TableHead>
                <TableHead className="w-8"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Error Code</TableHead>
                <TableHead>Error Message</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Retried</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((err) => {
                const isExpanded = expandedId === err.id;
                const isSelected = selectedIds.has(err.id);
                const isRetryingThis = retryMutation.isPending && retryMutation.variables?.errorId === err.id;
                return (
                  <React.Fragment key={err.id}>
                    <TableRow
                      className={`hover:bg-muted/50 cursor-pointer ${err.resolved ? "opacity-60" : ""}`}
                      onClick={() => setExpandedId(isExpanded ? null : err.id)}
                    >
                      <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                        {!err.resolved && (
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleSelected(err.id)} />
                        )}
                      </TableCell>
                      <TableCell className="p-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {err.resolved && <CheckCircle2 className="w-3 h-3 inline mr-1 text-green-400" />}
                        {err.name || "—"}
                      </TableCell>
                      <TableCell>
                        {err.phone ? (
                          <span className="text-xs text-muted-foreground">{err.phone}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {err.email ? (
                          <span className="text-xs text-muted-foreground truncate block max-w-[180px]">{err.email}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {getErrorBadge(err.error_code)}
                          {!err.resolved && getRiskBadge(err.error_code)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[180px]">
                        <span className="text-xs text-muted-foreground truncate block">
                          {err.error_message || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(err.created_at)}</span>
                      </TableCell>
                      <TableCell>
                        {err.retry_count > 0 ? (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {err.retry_count}x{err.last_retry_at ? ` ${formatDate(err.last_retry_at)}` : ""}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {!err.resolved && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                disabled={isRetryingThis}
                                onClick={() => setConfirmRetryError(err)}
                              >
                                {isRetryingThis ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <RotateCcw className="w-3 h-3" />
                                )}
                                Retry
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => openEditRetry(err)}
                              >
                                Edit & Retry
                              </Button>
                            </>
                          )}
                          <AlertDialog open={deleteConfirmId === err.id} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                            <AlertDialogTrigger asChild>
                              <button
                                onClick={() => setDeleteConfirmId(err.id)}
                                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                              >
                                Delete
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Error Record</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the error for <strong>{err.name || "Unknown"}</strong>? This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeleteConfirmId(null)} className="cursor-pointer">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(err.id)}
                                  className="bg-destructive hover:bg-destructive/90 cursor-pointer"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${err.id}-details`}>
                        <TableCell colSpan={10} className="bg-muted/20 p-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1 font-medium">Market</p>
                              <p className="text-foreground">{formatSlug(err.market_slug)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1 font-medium">Situation</p>
                              <p className="text-foreground">{formatSlug(err.situation_slug)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1 font-medium">Source</p>
                              <p className="text-foreground">{err.source || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1 font-medium">Property Address</p>
                              <p className="text-foreground">{err.property_address || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1 font-medium">Error Code</p>
                              <p className="text-foreground font-mono text-xs">{err.error_code || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1 font-medium">Error Message</p>
                              <p className="text-foreground text-xs">{err.error_message || "—"}</p>
                            </div>
                          </div>
                          {err.retry_count > 0 && (
                            <div className="mt-3 text-xs text-muted-foreground">
                              Retried {err.retry_count}x{err.last_retry_at ? ` — last: ${formatDate(err.last_retry_at)}` : ""}
                            </div>
                          )}
                          {err.error_details && (
                            <div className="mt-4">
                              <p className="text-xs text-muted-foreground mb-1 font-medium">Error Details</p>
                              <pre className="text-xs bg-background border border-border rounded-md p-3 overflow-x-auto max-h-[300px] text-foreground/80">
                                {formatErrorDetails(err.error_details)}
                              </pre>
                            </div>
                          )}
                          {err.payload && (
                            <div className="mt-4">
                              <p className="text-xs text-muted-foreground mb-1 font-medium">Stored Payload</p>
                              <pre className="text-xs bg-background border border-border rounded-md p-3 overflow-x-auto max-h-[300px] text-foreground/80">
                                {JSON.stringify(err.payload, null, 2)}
                              </pre>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!confirmRetryError} onOpenChange={(open) => !open && setConfirmRetryError(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Retry</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Re-submit <strong>{confirmRetryError?.name || "Unknown"}</strong> through the full pipeline (DB + GHL)?
                </p>
                {confirmRetryError && (
                  <>
                    <div className="flex items-center gap-2">
                      {getErrorBadge(confirmRetryError.error_code)}
                      {getRiskBadge(confirmRetryError.error_code)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getRetryRiskLabel(confirmRetryError.error_code)}
                    </p>
                    <p className="text-sm text-muted-foreground bg-muted rounded-md p-3">
                      {getRetryAdvice(confirmRetryError.error_code, confirmRetryError.error_message)}
                    </p>
                    {confirmRetryError.retry_count > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Previously retried {confirmRetryError.retry_count}x
                        {confirmRetryError.last_retry_at ? ` (last: ${formatDate(confirmRetryError.last_retry_at)})` : ""}
                      </p>
                    )}
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmRetryError(null)} className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmRetryError) {
                  retryMutation.mutate({ errorId: confirmRetryError.id });
                }
              }}
              className="cursor-pointer"
            >
              Confirm Retry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editingError} onOpenChange={(open) => !open && setEditingError(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit & Retry</DialogTitle>
            <DialogDescription>
              Modify the lead data before retrying. Fields left empty will use the original stored values.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-name" className="text-xs">Name</Label>
              <Input id="edit-name" value={editPayload.name || ""} onChange={(e) => setEditPayload((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-phone" className="text-xs">Phone</Label>
              <Input id="edit-phone" value={editPayload.phone || ""} onChange={(e) => setEditPayload((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-email" className="text-xs">Email</Label>
              <Input id="edit-email" value={editPayload.email || ""} onChange={(e) => setEditPayload((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-address" className="text-xs">Property Address</Label>
              <Input id="edit-address" value={editPayload.property_address || ""} onChange={(e) => setEditPayload((p) => ({ ...p, property_address: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-market" className="text-xs">Market</Label>
              <Input id="edit-market" value={editPayload.market_slug || ""} onChange={(e) => setEditPayload((p) => ({ ...p, market_slug: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-situation" className="text-xs">Situation</Label>
              <Input id="edit-situation" value={editPayload.situation_slug || ""} onChange={(e) => setEditPayload((p) => ({ ...p, situation_slug: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-source" className="text-xs">Source</Label>
              <Input id="edit-source" value={editPayload.source || ""} onChange={(e) => setEditPayload((p) => ({ ...p, source: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingError(null)}>Cancel</Button>
            <Button onClick={handleEditedRetry} disabled={retryMutation.isPending}>
              {retryMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RotateCcw className="w-3 h-3 mr-1" />}
              Retry with Edits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={clearResolvedOpen} onOpenChange={setClearResolvedOpen}>
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
              onClick={() => clearResolvedMutation.mutate()}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
            >
              {clearResolvedMutation.isPending ? "Clearing..." : "Clear All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <div className="text-xl font-bold text-foreground">{value}</div>
    </div>
  );
}

export default AdminLeadErrors;
