"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { AlertTriangle, Loader2, RotateCcw, ChevronDown, ChevronRight, Database, Globe, Wifi, Search } from "lucide-react";

type LeadError = {
  id: string;
  created_at: string;
  email: string | null;
  error_code: string | null;
  error_details: string | null;
  error_message: string | null;
  market_slug: string | null;
  name: string | null;
  phone: string | null;
  property_address: string | null;
  situation_slug: string | null;
  source: string | null;
};

type ErrorFilter = "all" | "db" | "ghl_api" | "ghl_fetch";

const AdminLeadErrors = () => {
  const [filter, setFilter] = useState<ErrorFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
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
    mutationFn: async (err: LeadError) => {
      const { error } = await supabase.from("leads").insert({
        name: err.name || "Unknown",
        phone: err.phone || "Unknown",
        email: err.email,
        property_address: err.property_address,
        market_slug: err.market_slug || "unknown",
        situation_slug: err.situation_slug || "unknown",
        source: err.source || undefined,
      });
      if (error) throw error;
    },
    onSuccess: (_data, err) => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics-leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview-stats"] });
      toast({ title: "Lead re-submitted", description: `${err.name} restored to pipeline.` });
    },
    onError: (error, err) => {
      toast({
        variant: "destructive",
        title: "Retry failed",
        description: error instanceof Error ? error.message : `Could not re-submit ${err.name}`,
      });
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

  const filtered = useMemo(() => {
    if (!errors) return [];
    if (filter === "all") return errors;
    return errors.filter((e) => {
      const code = e.error_code || "";
      switch (filter) {
        case "db": return !code.startsWith("GHL");
        case "ghl_api": return code === "GHL_ERROR";
        case "ghl_fetch": return code === "GHL_FETCH_ERROR";
        default: return true;
      }
    });
  }, [errors, filter]);

  const stats = useMemo(() => {
    if (!errors) return { total: 0, db: 0, ghlApi: 0, ghlFetch: 0, other: 0 };
    const total = errors.length;
    const db = errors.filter((e) => !(e.error_code || "").startsWith("GHL")).length;
    const ghlApi = errors.filter((e) => e.error_code === "GHL_ERROR").length;
    const ghlFetch = errors.filter((e) => e.error_code === "GHL_FETCH_ERROR").length;
    const other = total - db - ghlApi - ghlFetch;
    return { total, db, ghlApi, ghlFetch, other };
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

  const formatErrorDetails = (details: string | null) => {
    if (!details) return null;
    try {
      const parsed = JSON.parse(details);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return details;
    }
  };

  const isRetrying = retryMutation.isPending;
  const retryingId = retryMutation.variables?.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Lead Errors</h1>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Errors" value={stats.total.toString()} icon={<AlertTriangle className="w-4 h-4 text-destructive" />} />
        <StatCard label="Database" value={stats.db.toString()} icon={<Database className="w-4 h-4 text-red-400" />} />
        <StatCard label="GHL API" value={stats.ghlApi.toString()} icon={<Globe className="w-4 h-4 text-orange-400" />} />
        <StatCard label="GHL Network" value={stats.ghlFetch.toString()} icon={<Wifi className="w-4 h-4 text-amber-400" />} />
        <StatCard label="Other" value={stats.other.toString()} icon={<Search className="w-4 h-4 text-muted-foreground" />} />
      </div>

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
                <TableHead className="w-8"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Error Code</TableHead>
                <TableHead>Error Message</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((err) => {
                const isExpanded = expandedId === err.id;
                return (
                  <React.Fragment key={err.id}>
                    <TableRow
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : err.id)}
                    >
                      <TableCell className="p-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{err.name || "—"}</TableCell>
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
                      <TableCell>{getErrorBadge(err.error_code)}</TableCell>
                      <TableCell className="max-w-[180px]">
                        <span className="text-xs text-muted-foreground truncate block">
                          {err.error_message || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(err.created_at)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            disabled={isRetrying && retryingId === err.id}
                            onClick={() => retryMutation.mutate(err)}
                          >
                            {isRetrying && retryingId === err.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3 h-3" />
                            )}
                            Retry
                          </Button>
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
                        <TableCell colSpan={8} className="bg-muted/20 p-4">
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
                          {err.error_details && (
                            <div className="mt-4">
                              <p className="text-xs text-muted-foreground mb-1 font-medium">Error Details</p>
                              <pre className="text-xs bg-background border border-border rounded-md p-3 overflow-x-auto max-h-[300px] text-foreground/80">
                                {formatErrorDetails(err.error_details)}
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
