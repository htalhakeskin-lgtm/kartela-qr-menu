import "server-only";

import { env } from "@/lib/env";
import { logger } from "@/server/logger";

/**
 * The Vercel REST API for the platform admin (ADR-0002, D-19): add, check and remove a project
 * domain, and the Deploy Hook that rebuilds the host map. Without a token / hook the panel shows
 * the manual steps instead. Never called inside a database transaction.
 */
export type DomainCheck = { ok: true; verified: boolean } | { ok: false; reason: string };

function api(): { base: string; query: string; token: string } | null {
  if (!env.VERCEL_API_TOKEN || !env.VERCEL_PROJECT_ID) return null;
  return {
    base: `https://api.vercel.com`,
    query: env.VERCEL_TEAM_ID ? `?teamId=${encodeURIComponent(env.VERCEL_TEAM_ID)}` : "",
    token: env.VERCEL_API_TOKEN,
  };
}

export const vercelConfigured = (): boolean => api() !== null;
export const deployHookConfigured = (): boolean => Boolean(env.DEPLOY_HOOK_URL);

async function call(method: string, path: string, body?: unknown): Promise<Response | null> {
  const config = api();
  if (!config) return null;
  return fetch(`${config.base}${path}${config.query}`, {
    method,
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
}

const project = () => encodeURIComponent(env.VERCEL_PROJECT_ID ?? "");

async function verdict(response: Response | null, action: string): Promise<DomainCheck> {
  if (!response) return { ok: false, reason: "Vercel API anahtarı tanımlı değil." };
  if (!response.ok) {
    logger.warn("vercel.domain_failed", { action, status: response.status });
    return { ok: false, reason: `Vercel isteği başarısız (durum ${String(response.status)}).` };
  }
  const data = (await response.json()) as { verified?: boolean };
  return { ok: true, verified: data.verified === true };
}

export async function addProjectDomain(host: string): Promise<DomainCheck> {
  return verdict(await call("POST", `/v10/projects/${project()}/domains`, { name: host }), "add");
}

export async function checkProjectDomain(host: string): Promise<DomainCheck> {
  return verdict(
    await call("GET", `/v9/projects/${project()}/domains/${encodeURIComponent(host)}`),
    "check",
  );
}

export async function removeProjectDomain(host: string): Promise<boolean> {
  const response = await call(
    "DELETE",
    `/v9/projects/${project()}/domains/${encodeURIComponent(host)}`,
  );
  return response?.ok ?? false;
}

/** Starts a production build with the current panel data (vercel-build exports it, K-50). */
export async function triggerDeploy(): Promise<boolean> {
  if (!env.DEPLOY_HOOK_URL) return false;
  const response = await fetch(env.DEPLOY_HOOK_URL, {
    method: "POST",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) logger.warn("vercel.deploy_hook_failed", { status: response.status });
  return response.ok;
}
