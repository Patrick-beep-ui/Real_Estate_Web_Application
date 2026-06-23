function fixUnescapedQuotes(text: string): string {
  const result: string[] = [];
  let inString = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (ch === "\\" && inString) {
      result.push(ch);
      i++;
      if (i < text.length) {
        result.push(text[i]);
        i++;
      }
      continue;
    }

    if (ch === '"') {
      if (!inString) {
        inString = true;
        result.push(ch);
        i++;
        continue;
      }

      if (isRealQuote(text, i)) {
        inString = false;
        result.push(ch);
        i++;
        continue;
      }

      result.push("\\", '"');
      i++;
      continue;
    }

    result.push(ch);
    i++;
  }

  return result.join("");
}

/**
 * Same look-ahead logic as fixUnescapedQuotes but reused for sanitizeLiteralNewlines.
 * Returns true if the quote at position i in text is a real JSON structural quote
 * (property key opening/closing, string delimiter), not an unescaped embedded quote.
 */
function isRealQuote(text: string, i: number): boolean {
  let j = i + 1;
  while (
    j < text.length &&
    (text[j] === " " || text[j] === "\t" || text[j] === "\n" || text[j] === "\r")
  ) {
    j++;
  }
  return j < text.length && (text[j] === "," || text[j] === ":" || text[j] === "}" || text[j] === "]");
}

/**
 * Replaces literal (unescaped) newlines and carriage returns inside JSON string
 * values with their \n / \r escape sequences. This handles the common Gemini
 * failure mode where a large content field is returned with actual newlines
 * inside a JSON string, making the JSON invalid.
 */
function sanitizeLiteralNewlines(text: string): string {
  const result: string[] = [];
  let inString = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    // Skip past escape sequences as a unit
    if (ch === "\\" && inString) {
      result.push(ch);
      i++;
      if (i < text.length) {
        result.push(text[i]);
        i++;
      }
      continue;
    }

    // Toggle string mode on JSON structural double-quote
    if (ch === '"') {
      if (!inString) {
        inString = true;
        result.push(ch);
        i++;
        continue;
      }
      if (isRealQuote(text, i)) {
        inString = false;
        result.push(ch);
        i++;
        continue;
      }
      // Unescaped quote inside string value — escape it
      result.push("\\", '"');
      i++;
      continue;
    }

    // Inside a string, replace literal newlines with escape sequences
    if (inString && ch === "\n") {
      result.push("\\n");
      i++;
      continue;
    }
    if (inString && ch === "\r") {
      // Skip \r — next char may be \n which we'll handle on its own turn
      i++;
      continue;
    }

    result.push(ch);
    i++;
  }

  return result.join("");
}

function tryParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // Try fixing literal newlines inside string values first
    const newlineFixed = sanitizeLiteralNewlines(text);
    try {
      return JSON.parse(newlineFixed);
    } catch {
      // Last resort: also fix unescaped quotes
      const fullyFixed = fixUnescapedQuotes(newlineFixed);
      try {
        return JSON.parse(fullyFixed);
      } catch {
        return null;
      }
    }
  }
}

export default function safeJsonParse(text: string) {
  // Strip opening fence (e.g. ```json or ``` with optional whitespace/newline)
  // Strip closing fence (trailing ```)
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const result = tryParse(cleaned);
  if (result) return result;

  const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (match) {
    return tryParse(match[0]);
  }

  return null;
}
