/**
 * Centralized env resolution with staging fallbacks.
 *
 * Local dev: set NEXT_PUBLIC_TESTING_* and TESTING_* vars in .env.local
 * alongside the prod vars. The testing vars take priority when present.
 *
 * Vercel staging: vars are already set with their final names (no prefix),
 * so the fallback to the non-prefixed var kicks in automatically.
 *
 * Vercel production: only the non-prefixed vars exist, fallback is a no-op.
 */

// ── Client-side (NEXT_PUBLIC_*) ──────────────────────────────────────────────

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_TESTING_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_TESTING_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

// ── Server-side ──────────────────────────────────────────────────────────────

export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.TESTING_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

export const GHL_API_KEY =
  process.env.TESTING_GHL_API_KEY ||
  process.env.GHL_API_KEY;

export const GHL_LOCATION_ID =
  process.env.TESTING_GHL_LOCATION_ID ||
  process.env.GHL_LOCATION_ID;

export const GHL_API_BASE_URL =
  process.env.TESTING_GHL_API_BASE_URL ||
  process.env.GHL_API_BASE_URL ||
  "https://services.leadconnectorhq.com";

export const GHL_PIPELINE_ID =
  process.env.TEST_GHL_PIPELINE_ID ||
  process.env.GHL_PIPELINE_ID;

export const GHL_PIPELINE_STAGE_ID =
  process.env.TEST_GHL_PIPELINE_STAGE_ID ||
  process.env.GHL_PIPELINE_STAGE_ID;

// ── Slack ────────────────────────────────────────────────────────────────────

export const SLACK_WEBHOOK_URL =
  process.env.TEST_SLACK_WEBHOOK_URL ||
  process.env.SLACK_WEBHOOK_URL ||
  "";

export const SLACK_WEBHOOK_URL_SUCCESS =
  process.env.TEST_SLACK_WEBHOOK_URL ||
  process.env.SLACK_WEBHOOK_URL_SUCCESS ||
  "";
