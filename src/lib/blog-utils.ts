export const createHeadingId = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * Protection layer for malformed Gemini responses.
 * Gemini occasionally wraps the entire JSON payload in a ```json code block.
 * When safeJsonParse fails server-side, the raw response (code fences + JSON)
 * gets stored in the `content` column. This function detects that case and
 * extracts the actual markdown string — pure pass-through for clean content.
 */
export const resolveContent = (raw: string): string => {
  if (!raw) return "";

  const stripped = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  if (!stripped.startsWith("{")) return raw;

  try {
    const parsed = JSON.parse(stripped);
    if (typeof parsed.content === "string") return parsed.content;
  } catch {}

  const keyMatch = stripped.match(/"content"\s*:\s*"/);
  if (!keyMatch) return raw;

  const start = (keyMatch.index ?? 0) + keyMatch[0].length;
  let end = start;
  let escaped = false;

  while (end < stripped.length) {
    const ch = stripped[end];
    if (escaped) {
      escaped = false;
    } else if (ch === "\\") {
      escaped = true;
    } else if (ch === '"') {
      let peek = end + 1;
      while (peek < stripped.length && (stripped[peek] === " " || stripped[peek] === "\t" || stripped[peek] === "\n" || stripped[peek] === "\r")) {
        peek++;
      }
      if (peek < stripped.length && (stripped[peek] === "," || stripped[peek] === "}" || stripped[peek] === "]")) {
        break;
      }
    }
    end++;
  }

  const rawValue = stripped.slice(start, end);

  try {
    return JSON.parse(`"${rawValue}"`);
  } catch {
    return rawValue
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
};

export const cleanMarkdownContent = (content: string): string => {
  if (!content) return "";
  let cleaned = content;
  cleaned = cleaned.replace(/##\s*##\s*/g, "## ");
  cleaned = cleaned.replace(/#\s*#\s*/g, "# ");
  cleaned = cleaned.replace(/###\s*###\s*/g, "### ");
  cleaned = cleaned.replace(/####\s*####\s*/g, "#### ");
  cleaned = cleaned.replace(/([^\n])\n(#{1,6}\s)/g, "$1\n\n$2");
  return cleaned;
};
