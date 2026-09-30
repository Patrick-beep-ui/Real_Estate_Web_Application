"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

export type VercelLogLevel = "debug" | "error" | "fatal" | "info" | "trace" | "warning";

export type VercelLog = {
  rowId: string;
  timestampInMs: number;
  level: VercelLogLevel;
  message: string;
  messageTruncated?: boolean;
  source: string;
  domain?: string;
  requestMethod?: string;
  requestPath?: string;
  responseStatusCode?: number;
};

export type VercelDeployment = {
  id: string;
  url: string;
  createdAt: number;
  state: string;
  target: string | null;
  branch: string | null;
  commitMessage: string | null;
};

const MAX_LOGS = 2000;

async function authHeader() {
  const token = (await supabase.auth.getSession()).data.session?.access_token || "";
  return { Authorization: `Bearer ${token}` };
}

export function useVercelDeployments(target: string) {
  return useQuery({
    queryKey: ["vercel-deployments", target],
    queryFn: async () => {
      const qs = target === "all" ? "" : `?target=${target}`;
      const res = await fetch(`/api/admin/vercel/deployments${qs}`, { headers: await authHeader() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load deployments");
      return json as { project: { id: string; name: string }; deployments: VercelDeployment[] };
    },
    staleTime: 60_000,
  });
}

export type LogFilters = {
  level: "all" | "error" | "warning" | "info";
  source: string;
  search: string;
  errorsOnly: boolean;
};

/** Live-tails runtime logs for one deployment by reconnecting to the proxy stream. */
export function useVercelLogStream(deploymentId: string | null) {
  const [logs, setLogs] = useState<VercelLog[]>([]);
  const [live, setLive] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seen = useRef(new Set<string>());
  const abortRef = useRef<AbortController | null>(null);

  const clear = useCallback(() => {
    seen.current = new Set();
    setLogs([]);
  }, []);

  useEffect(() => {
    clear();
    setError(null);
  }, [deploymentId, clear]);

  useEffect(() => {
    if (!deploymentId || !live) return;
    let stopped = false;

    const run = async () => {
      while (!stopped) {
        const controller = new AbortController();
        abortRef.current = controller;
        try {
          const res = await fetch(
            `/api/admin/vercel/logs?deploymentId=${encodeURIComponent(deploymentId)}&seconds=25`,
            { headers: await authHeader(), signal: controller.signal }
          );
          if (!res.ok || !res.body) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json.error || `Request failed (${res.status})`);
          }
          setConnected(true);
          setError(null);

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            const batch: VercelLog[] = [];
            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const log = JSON.parse(line) as VercelLog;
                if (log.source === "delimiter") continue;
                const key = log.rowId || `${log.timestampInMs}-${log.message}`;
                if (seen.current.has(key)) continue;
                seen.current.add(key);
                batch.push(log);
              } catch {
                // ignore partial / non-JSON lines
              }
            }
            if (batch.length) {
              setLogs((prev) =>
                [...batch, ...prev]
                  .sort((a, b) => b.timestampInMs - a.timestampInMs)
                  .slice(0, MAX_LOGS)
              );
            }
          }
        } catch (err) {
          if (stopped || (err as Error).name === "AbortError") break;
          setError((err as Error).message);
          setConnected(false);
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }
        setConnected(false);
        if (!stopped) await new Promise((r) => setTimeout(r, 500));
      }
    };

    run();
    return () => {
      stopped = true;
      abortRef.current?.abort();
      setConnected(false);
    };
  }, [deploymentId, live]);

  return { logs, live, setLive, connected, error, clear };
}

export function filterLogs(logs: VercelLog[], f: LogFilters) {
  const q = f.search.trim().toLowerCase();
  return logs.filter((l) => {
    if (f.level === "error" && l.level !== "error" && l.level !== "fatal") return false;
    if (f.level === "warning" && l.level !== "warning") return false;
    if (f.level === "info" && l.level !== "info") return false;
    if (f.source !== "all" && l.source !== f.source) return false;
    if (f.errorsOnly && !((l.responseStatusCode ?? 0) >= 400 || l.level === "error" || l.level === "fatal")) return false;
    if (q && !`${l.message} ${l.requestPath ?? ""} ${l.domain ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function useFilteredLogs(logs: VercelLog[], filters: LogFilters) {
  return useMemo(() => filterLogs(logs, filters), [logs, filters]);
}
