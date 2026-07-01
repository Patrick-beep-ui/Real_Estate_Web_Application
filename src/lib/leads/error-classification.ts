export type ErrorCategory = "transient" | "structural" | "unknown";

const TRANSIENT_CODES = new Set(["429", "GHL_FETCH_ERROR"]);

export function classifyError(code: string | null): ErrorCategory {
  if (!code) return "unknown";
  if (TRANSIENT_CODES.has(code)) return "transient";
  if (code.startsWith("GHL")) return "structural";
  if (code === "23505") return "transient";
  return "structural";
}

export function getRetryRiskLabel(code: string | null): string {
  const cat = classifyError(code);
  switch (cat) {
    case "transient":
      return "Low — temporary issue, likely to succeed";
    case "structural":
      return "High — data or configuration issue, may fail again";
    default:
      return "Unknown — review details before retrying";
  }
}

export function getRetryAdvice(code: string | null, message: string | null): string {
  const cat = classifyError(code);
  switch (cat) {
    case "transient":
      if (code === "429") return "The submission was rate-limited. A retry after a few seconds should succeed.";
      if (code === "GHL_FETCH_ERROR") return "A network error occurred while contacting GHL. This is usually temporary — retry should work.";
      return "A temporary error occurred. Retry has a good chance of succeeding.";
    case "structural":
      if (code === "GHL_ERROR") return "GHL rejected the data. Check the error details and consider editing the payload before retrying.";
      if (code && code.startsWith("GHL")) return "A GHL processing error occurred. Review the error details and ensure the data is valid.";
      return "A data or configuration issue caused this error. A direct retry will likely fail. Edit the payload or fix the root cause first.";
    default:
      return "Check the error details below and decide whether to retry or discard this error.";
  }
}
