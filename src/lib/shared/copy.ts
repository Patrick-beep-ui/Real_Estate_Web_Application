/**
 * Claim-safety scrubbers for marketing copy.
 *
 * Same contract as the phone mechanism in `phone.ts`: the STORED value is left
 * alone, and the correction is applied to whatever the visitor actually reads.
 * That matters here because most of the affected copy lives in
 * `generated_content` / `blog_posts` in Supabase — hundreds of rows we do not
 * want to rewrite — and because the same DB content is re-fetched on every
 * deploy. Fixing it at render time means the claim is gone from the live site
 * the moment this ships, with no data migration and no risk of a partially
 * updated dataset.
 *
 * The claim being scrubbed: "cash offer in 24 hours". Only the 24-hour
 * timeline is removed — the offer itself, the no-obligation/no-repairs
 * differentiators, and closing-speed language ("close in days", "as few as 7
 * days") are deliberately preserved.
 */

import { sanitizeContactInfo } from "@/lib/shared/phone";

/**
 * The 24-hour phrase with its leading preposition, so removal never strands
 * "in" / "within" on its own. The separator class covers space, non-breaking
 * space and hyphen so "24-Hour" and "24&nbsp;hours" are caught too.
 */
const PREPOSITIONAL_24H = String.raw`\b(?:in|within|as\s+little\s+as|less\s+than|under|after)\s+24[\s\u00a0-]?(?:hours|hrs|hour)\b`;

/** The bare phrase, with or without a preposition. */
const BARE_24H = String.raw`\b24[\s\u00a0-]?(?:hours|hrs|hour)\b`;

/**
 * Ordered removal rules. Two passes over the prepositional form matter:
 * when the phrase is immediately followed by ", and" (e.g. "make a cash
 * offer within 24 hours, and close on your timeline") the comma has to be
 * consumed too. A blanket "remove the comma before and" rule would also eat
 * legitimate Oxford commas elsewhere in the same sentence, so the two cases
 * are told apart by adjacency instead.
 */
const COPY_RULES: [RegExp, string][] = [
  // Dangling conjunction: "within 24 hours, and close" → "and close"
  [new RegExp(`${PREPOSITIONAL_24H},[ \\t]+(?=(?:and|or|but)\\b)`, "gi"), ""],
  [new RegExp(PREPOSITIONAL_24H, "gi"), ""],
  // Bare form: "24-hour response", "24 hours"
  [new RegExp(BARE_24H, "gi"), ""],
  // "24hrs" with no separator.
  [/\b24[\s\u00a0-]?hrs\b/gi, ""],
];

/**
 * Removal leaves punctuation and whitespace artifacts behind. Every pass below
 * is horizontal-whitespace only ([ \t], never \s) so markdown paragraph breaks
 * and HTML tag separation in blog bodies survive untouched.
 */
const CLEANUP_RULES: [RegExp, string][] = [
  // "(within 24 hours)" → "", "(in 24 hours)." → "."
  [/\(\s*\)/g, ""],
  [/\(\s*([.,;:!?])/g, "$1"],
  // "offer ." / "offer ," / "offer ;"
  [/[ \t]+([.,;:!?])/g, "$1"],
  // Double punctuation introduced by removing a trailing clause.
  [/([.,;:!?])[ \t]*(?=[.,;:!?])/g, "$1"],
  // Chained preposition: "in as little as 24 hours" / "in less than 24 hours"
  // loses the phrase but leaves the first preposition stranded before the stop.
  [/[ \t]+(?:in|within|under|after|as\s+little\s+as|less\s+than)(?=[ \t]*[.,;:!?])/g, ""],
  // Collapse the gap the removed phrase sat in, plus any leading/trailing
  // space it left on the line. Not \s — newlines are meaningful in markdown.
  [/[ \t]{2,}/g, " "],
  [/[ \t]+$/gm, ""],
  [/^[ \t]+/, ""],
];

/**
 * Remove the 24-hour offer timeline from a single string.
 * Returns the input untouched if it contains nothing to scrub, or if
 * scrubbing would empty it out entirely.
 */
export function scrubCopy(text: string): string {
  if (!text) return text;
  if (!new RegExp(BARE_24H, "i").test(text) && !/\b24[\s\u00a0-]?hrs\b/i.test(text)) {
    return text;
  }

  let result = text;
  for (const [pattern, replacement] of COPY_RULES) {
    result = result.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of CLEANUP_RULES) {
    result = result.replace(pattern, replacement);
  }

  return result.trim() ? result : text;
}

/**
 * The one-stop entry point for rendered copy: phone canonicalization (so a
 * stale number in a stored blog body can never reach a visitor) plus the
 * timeline scrub.
 */
export function sanitizeCopy(text: string): string {
  return scrubCopy(sanitizeContactInfo(text));
}
