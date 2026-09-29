"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Pause, Play, Trash2, RefreshCw, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useVercelDeployments, useVercelLogStream, useFilteredLogs,
  type LogFilters, type VercelLog,
} from "@/hooks/admin/useVercelLogs";

const LEVEL_STYLES: Record<string, string> = {
  error: "text-destructive",
  fatal: "text-destructive font-semibold",
  warning: "text-yellow-500",
  info: "text-foreground",
  debug: "text-muted-foreground",
  trace: "text-muted-foreground",
};

function statusClass(code?: number) {
  if (!code) return "text-muted-foreground";
  if (code >= 500) return "text-destructive";
  if (code >= 400) return "text-yellow-500";
  return "text-green-500";
}

function LogRow({ log }: { log: VercelLog }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border-b border-border px-3 py-1.5 font-mono text-xs hover:bg-muted/40 cursor-pointer"
      onClick={() => setOpen((o) => !o)}
    >
      <div className="flex gap-3 items-baseline">
        <span className="text-muted-foreground shrink-0 w-[150px]">
          {format(new Date(log.timestampInMs), "MMM d HH:mm:ss.SSS")}
        </span>
        <span className={`shrink-0 w-12 uppercase ${LEVEL_STYLES[log.level] ?? ""}`}>{log.level}</span>
        <span className={`shrink-0 w-10 ${statusClass(log.responseStatusCode)}`}>
          {log.responseStatusCode || "—"}
        </span>
        <span className="shrink-0 w-[220px] truncate text-muted-foreground" title={log.requestPath}>
          {log.requestMethod} {log.requestPath}
        </span>
        <span className={`min-w-0 ${open ? "whitespace-pre-wrap break-all" : "truncate"} ${LEVEL_STYLES[log.level] ?? ""}`}>
          {log.message || <span className="text-muted-foreground">(no message)</span>}
          {log.messageTruncated && <span className="text-muted-foreground"> …[truncated]</span>}
        </span>
      </div>
      {open && (
        <div className="mt-1 pl-[162px] text-muted-foreground">
          source: {log.source} · domain: {log.domain || "—"} · id: {log.rowId}
        </div>
      )}
    </div>
  );
}

export function VercelLogsView() {
  const [target, setTarget] = useState("production");
  const [selectedId, setDeploymentId] = useState<string | null>(null);
  const [filters, setFilters] = useState<LogFilters>({
    level: "all", source: "all", search: "", errorsOnly: false,
  });

  const deploymentsQuery = useVercelDeployments(target);
  const deployments = useMemo(() => deploymentsQuery.data?.deployments ?? [], [deploymentsQuery.data]);

  // Use the picked deployment if it's still listed, else the newest READY one.
  const deploymentId = useMemo(() => {
    if (selectedId && deployments.some((d) => d.id === selectedId)) return selectedId;
    return (deployments.find((d) => d.state === "READY") ?? deployments[0])?.id ?? null;
  }, [deployments, selectedId]);

  const { logs, live, setLive, connected, error, clear } = useVercelLogStream(deploymentId);
  const visible = useFilteredLogs(logs, filters);
  const errorCount = logs.filter((l) => l.level === "error" || l.level === "fatal" || (l.responseStatusCode ?? 0) >= 500).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Vercel Logs</h1>
          <p className="text-sm text-muted-foreground">
            Runtime logs for {deploymentsQuery.data?.project.name ?? "the project"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Circle className={`h-2.5 w-2.5 ${connected ? "fill-green-500 text-green-500" : "fill-muted text-muted-foreground"}`} />
          <span className="text-muted-foreground">{connected ? "Live" : live ? "Connecting…" : "Paused"}</span>
        </div>
      </div>

      {deploymentsQuery.error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {(deploymentsQuery.error as Error).message}
        </div>
      )}
      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Log stream error: {error} (retrying…)
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Select value={target} onValueChange={(v) => { setTarget(v); setDeploymentId(null); }}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="production">Production</SelectItem>
            <SelectItem value="preview">Preview</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>

        <Select value={deploymentId ?? undefined} onValueChange={setDeploymentId}>
          <SelectTrigger className="w-[360px]">
            <SelectValue placeholder={deploymentsQuery.isLoading ? "Loading deployments…" : "Select deployment"} />
          </SelectTrigger>
          <SelectContent>
            {deployments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {format(new Date(d.createdAt), "MMM d HH:mm")} · {d.state}
                {d.branch ? ` · ${d.branch}` : ""}
                {d.commitMessage ? ` · ${d.commitMessage.slice(0, 40)}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="ghost" size="icon" onClick={() => deploymentsQuery.refetch()} title="Refresh deployments">
          <RefreshCw className={`h-4 w-4 ${deploymentsQuery.isFetching ? "animate-spin" : ""}`} />
        </Button>

        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setLive(!live)}>
            {live ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
            {live ? "Pause" : "Resume"}
          </Button>
          <Button variant="outline" size="sm" onClick={clear}>
            <Trash2 className="h-4 w-4 mr-1" /> Clear
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search message, path, domain…"
          className="w-[280px]"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <Select value={filters.level} onValueChange={(v) => setFilters({ ...filters, level: v as LogFilters["level"] })}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.source} onValueChange={(v) => setFilters({ ...filters, source: v })}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="serverless">Functions</SelectItem>
            <SelectItem value="edge-middleware">Middleware</SelectItem>
            <SelectItem value="edge-function">Edge functions</SelectItem>
            <SelectItem value="request">Requests</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 ml-2">
          <Switch id="errors-only" checked={filters.errorsOnly} onCheckedChange={(v) => setFilters({ ...filters, errorsOnly: v })} />
          <Label htmlFor="errors-only" className="text-sm">Errors only</Label>
        </div>
        <div className="ml-auto flex gap-2 text-xs">
          <Badge variant="secondary">{visible.length} / {logs.length} shown</Badge>
          {errorCount > 0 && <Badge variant="destructive">{errorCount} errors</Badge>}
        </div>
      </div>

      <div className="rounded border border-border bg-card max-h-[calc(100vh-320px)] overflow-auto">
        {visible.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {deploymentId
              ? live ? "Waiting for logs… new requests to this deployment will appear here." : "No logs."
              : "Select a deployment."}
          </div>
        ) : (
          visible.map((log) => <LogRow key={log.rowId || `${log.timestampInMs}-${log.message}`} log={log} />)
        )}
      </div>
    </div>
  );
}
