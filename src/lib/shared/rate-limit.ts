import { supabase } from "@/lib/supabase/client";

const TAG = "[rate-limit]";

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
};

const CLEANUP_INTERVAL = 100;
let cleanupCounter = 0;

function lazyCleanup() {
  cleanupCounter = (cleanupCounter + 1) % CLEANUP_INTERVAL;
  if (cleanupCounter !== 0) return;
  (supabase as any)
    .from("rate_limits")
    .delete()
    .lt("window_start", new Date(Date.now() - 86400000).toISOString())
    .then(() => {}, () => {});
}

export async function rateLimit(
  endpoint: string,
  identifier: string,
  opts: { max: number; windowSeconds: number; failOpen?: boolean }
): Promise<RateLimitResult> {
  const { max, windowSeconds, failOpen = true } = opts;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs).toISOString();

  lazyCleanup();

  try {
    const { data, error } = await (supabase as any).rpc("increment_rate_limit", {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_window_start: windowStart,
      p_max: max,
    });

    if (error) {
      console.warn(`${TAG} RPC failed (allowing request):`, error.message);
      if (failOpen) {
        return { success: true, remaining: 1, reset: now + windowMs };
      }
      return { success: false, remaining: 0, reset: now + windowMs };
    }

    const result = data as unknown as { count: number; window_start: number; max: number };
    const remaining = Math.max(0, result.max - result.count);
    return {
      success: result.count <= result.max,
      remaining,
      reset: result.window_start + windowMs,
    };
  } catch (err) {
    console.warn(`${TAG} Unexpected error (allowing request):`, err instanceof Error ? err.message : err);
    return { success: true, remaining: 1, reset: now + windowMs };
  }
}
