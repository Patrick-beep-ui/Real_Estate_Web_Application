const THANK_YOU_CONTEXT_STORAGE_KEY = "tbh_thank_you_context";
const THANK_YOU_CONTEXT_TTL_MS = 10 * 60 * 1000;

export interface ThankYouContext {
  originPagePath: string;
  leadSource: string;
  createdAt: number;
}

function isValidContext(value: unknown): value is ThankYouContext {
  if (!value || typeof value !== "object") return false;
  const context = value as Record<string, unknown>;
  return (
    typeof context.originPagePath === "string" &&
    context.originPagePath.startsWith("/") &&
    typeof context.leadSource === "string" &&
    context.leadSource.length > 0 &&
    typeof context.createdAt === "number"
  );
}

export function writeThankYouContext(context: Pick<ThankYouContext, "originPagePath" | "leadSource">): void {
  try {
    window.sessionStorage.setItem(
      THANK_YOU_CONTEXT_STORAGE_KEY,
      JSON.stringify({ ...context, createdAt: Date.now() })
    );
  } catch(err) {
    console.error(`Error writing ${THANK_YOU_CONTEXT_STORAGE_KEY}: ${err}`)
  }
}

/** Only the Thank You page reads this short-lived, non-attribution context. */
export function readThankYouContext(): Pick<ThankYouContext, "originPagePath" | "leadSource"> | null {
  try {
    const raw = window.sessionStorage.getItem(THANK_YOU_CONTEXT_STORAGE_KEY);
    if (!raw) return null;

    const context = JSON.parse(raw) as unknown;
    if (isValidContext(context) && Date.now() - context.createdAt <= THANK_YOU_CONTEXT_TTL_MS) {
      return { originPagePath: context.originPagePath, leadSource: context.leadSource };
    }
  } catch(err) {
    console.error(`Error reading ${THANK_YOU_CONTEXT_STORAGE_KEY}: ${err}`)
  }

  try {
    window.sessionStorage.removeItem(THANK_YOU_CONTEXT_STORAGE_KEY);
  } catch(err) {
    console.error(`Error removing ${THANK_YOU_CONTEXT_STORAGE_KEY}: ${err}`)
  }
  return null;
}
