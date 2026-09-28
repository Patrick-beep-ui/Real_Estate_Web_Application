import { scrubCopy } from "@/lib/shared/copy";

export const createHeadingId = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * Columns that are shown to a visitor or a crawler. Deliberately an allowlist
 * rather than "scrub every string in the row": `slug` and `canonical_url` use
 * hyphens, so a slug like `get-a-cash-offer-in-24-hours` would be rewritten
 * into a URL that no longer resolves. `id`, `status`, `category` and the
 * timestamps must pass through untouched for the same reason.
 */
const BLOG_COPY_FIELDS = [
  "title",
  "seo_title",
  "excerpt",
  "meta_description",
  "content",
] as const;

/**
 * Render-time claim scrub for a `blog_posts` row.
 *
 * Stored content is left alone — the 24-hour offer claim is retired from the
 * live site without a data migration, the same contract as the phone
 * sanitizer. Apply it to every public read of a post (listing, detail,
 * metadata, internal links) rather than at each individual JSX usage, so a new
 * consumer of `useBlogPost` cannot leak the claim by forgetting.
 */
export const scrubBlogPost = <T extends object>(post: T): T => {
  if (!post) return post;
  let changed = false;
  const next: Record<string, unknown> = { ...(post as Record<string, unknown>) };
  for (const field of BLOG_COPY_FIELDS) {
    const value = next[field];
    if (typeof value !== "string") continue;
    const scrubbed = scrubCopy(value);
    if (scrubbed !== value) {
      next[field] = scrubbed;
      changed = true;
    }
  }
  return (changed ? next : post) as T;
};

/** `scrubBlogPost` over a list, preserving order and length. */
export const scrubBlogPosts = <T extends object>(posts: T[]): T[] =>
  posts.map((post) => scrubBlogPost(post));

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

const CTA_HEADING = /^(ready|want|looking|interested|can i|should i)/i;

export const findFAQSectionIndex = (content: string): { start: number; end: number } | null => {
  if (!content) return null;
  const lines = content.split("\n");
  const faqHeading = /^##\s*(faq|faqs|frequently\s+asked\s+questions)\b/im;

  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (faqHeading.test(lines[i])) {
      start = i;
      break;
    }
  }
  if (start === -1) return null;

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const match = lines[i].match(/^##\s+(.+)/);
    if (match) {
      const heading = match[1].trim();
      if (heading.includes("?") && !CTA_HEADING.test(heading)) {
        continue;
      }
      end = i;
      break;
    }
  }

  return { start, end };
};

export const stripFAQFromContent = (content: string): string => {
  if (!content) return "";
  const section = findFAQSectionIndex(content);
  if (section) {
    const lines = content.split("\n");
    lines.splice(section.start, section.end - section.start);
    return lines.join("\n").trim();
  }
  return content
    .split(/(?=^## )/m)
    .filter((part) => {
      const firstLine = part.trimStart().split("\n")[0];
      const match = firstLine.match(/^## (.+)/);
      if (!match) return true;
      const heading = match[1].trim();
      if (heading.includes("?") || heading.toLowerCase().includes("question")) {
        return false;
      }
      return true;
    })
    .join("");
};

export const extractFAQItems = (content: string) => {
  if (!content) return [];
  const section = findFAQSectionIndex(content);

  if (section) {
    const lines = content.split("\n");
    const sectionLines = lines.slice(section.start + 1, section.end);
    const sectionContent = sectionLines.join("\n");

    const h3Regex = /^###\s+(.+?)\n([\s\S]+?)(?=^###|\n\n##|$)/gm;
    const items: { question: string; answer: string }[] = [];
    let match;

    while ((match = h3Regex.exec(sectionContent)) !== null) {
      const question = match[1].trim();
      const answer = match[2].trim().replace(/^- /, "");
      if (!question.includes("?")) continue;
      items.push({ question, answer });
    }

    if (items.length > 0) return items;

    const h2Regex = /^##\s+(.+?)\n([\s\S]+?)(?=^##|\n\n##|$)/gm;
    while ((match = h2Regex.exec(sectionContent)) !== null) {
      const question = match[1].trim();
      const answer = match[2].trim().replace(/^- /, "");
      if (!question.includes("?")) continue;
      items.push({ question, answer });
    }

    return items;
  }

  const faqRegex = /## (.+?)\n([\s\S]+?)(?=## |\n### |$)/g;
  const items: { question: string; answer: string }[] = [];
  let match;

  while ((match = faqRegex.exec(content)) !== null) {
    const question = match[1].trim();
    const answer = match[2].trim().replace(/^- /, "");

    if (!question.includes("?")) continue;
    if (CTA_HEADING.test(question)) continue;

    items.push({ question, answer });
  }

  return items;
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
