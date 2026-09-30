import "server-only";

/**
 * Minimal server-side client for the Vercel REST API, used by the admin
 * Logs page. The token never leaves the server.
 *
 * Required env vars (set in Vercel → Project → Settings → Environment Variables
 * and in .env.local for local dev):
 *   VERCEL_API_TOKEN   – personal/team access token with access to the project
 *   VERCEL_PROJECT_ID  – project id (prj_...) or project name
 *   VERCEL_TEAM_ID     – team id (team_...)  ─┐ one of these, if the project
 *   VERCEL_TEAM_SLUG   – team slug            ─┘ belongs to a team
 */

const API = "https://api.vercel.com";

export class VercelConfigError extends Error {}

export class VercelApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

function config() {
  const token = process.env.VERCEL_API_TOKEN;
  const project = process.env.VERCEL_PROJECT_ID;
  if (!token || !project) {
    throw new VercelConfigError(
      "Vercel logs are not configured. Set VERCEL_API_TOKEN and VERCEL_PROJECT_ID " +
        "(plus VERCEL_TEAM_ID or VERCEL_TEAM_SLUG for team projects)."
    );
  }
  return {
    token,
    project,
    teamId: process.env.VERCEL_TEAM_ID || undefined,
    teamSlug: process.env.VERCEL_TEAM_SLUG || undefined,
  };
}

export function vercelUrl(path: string, params: Record<string, string | undefined> = {}) {
  const { teamId, teamSlug } = config();
  const url = new URL(path, API);
  if (teamId) url.searchParams.set("teamId", teamId);
  else if (teamSlug) url.searchParams.set("slug", teamSlug);
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  return url;
}

export function vercelHeaders() {
  return { Authorization: `Bearer ${config().token}` };
}

async function vercelJson<T>(url: URL): Promise<T> {
  const res = await fetch(url, { headers: vercelHeaders(), cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let message = body;
    try {
      message = JSON.parse(body)?.error?.message || body;
    } catch {}
    throw new VercelApiError(`Vercel API ${res.status}: ${message || res.statusText}`, res.status);
  }
  return res.json() as Promise<T>;
}

let cachedProject: { id: string; name: string } | null = null;

/** Resolves VERCEL_PROJECT_ID (id or name) to the project id + name. */
export async function getProject() {
  if (cachedProject) return cachedProject;
  const { project } = config();
  const data = await vercelJson<{ id: string; name: string }>(
    vercelUrl(`/v9/projects/${encodeURIComponent(project)}`)
  );
  cachedProject = { id: data.id, name: data.name };
  return cachedProject;
}

export type VercelDeployment = {
  id: string;
  url: string;
  createdAt: number;
  state: string;
  target: string | null;
  branch: string | null;
  commitMessage: string | null;
};

type RawDeployment = {
  uid: string;
  url: string;
  created?: number;
  createdAt?: number;
  state?: string;
  readyState?: string;
  target?: string | null;
  meta?: Record<string, string | undefined>;
};

export async function listDeployments(opts: { target?: string; limit?: number } = {}) {
  const project = await getProject();
  const data = await vercelJson<{ deployments: RawDeployment[] }>(
    vercelUrl("/v6/deployments", {
      projectId: project.id,
      limit: String(opts.limit ?? 20),
      target: opts.target,
    })
  );
  const deployments: VercelDeployment[] = data.deployments.map((d) => ({
    id: d.uid,
    url: d.url,
    createdAt: d.createdAt ?? d.created ?? 0,
    state: d.readyState ?? d.state ?? "UNKNOWN",
    target: d.target ?? null,
    branch: d.meta?.githubCommitRef ?? null,
    commitMessage: d.meta?.githubCommitMessage ?? null,
  }));
  return { project, deployments };
}
