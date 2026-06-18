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

      let j = i + 1;
      while (
        j < text.length &&
        (text[j] === " " || text[j] === "\t" || text[j] === "\n" || text[j] === "\r")
      ) {
        j++;
      }
      if (j < text.length && (text[j] === "," || text[j] === "}" || text[j] === "]")) {
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

function tryParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const fixed = fixUnescapedQuotes(text);
    try {
      return JSON.parse(fixed);
    } catch {
      return null;
    }
  }
}

export default function safeJsonParse(text: string) {
  const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();
  const result = tryParse(cleaned);
  if (result) return result;

  const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (match) {
    return tryParse(match[0]);
  }

  return null;
}
