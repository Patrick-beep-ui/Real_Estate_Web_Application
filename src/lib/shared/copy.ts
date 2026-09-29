/**
 * Claim-safety scrubbers for marketing copy.
 *
 * The claims being scrubbed are the offer-timeline promises: "in 24 hours",
 * "in as little as 24-48 hours", "within a day" and "same-day". Removal is
 * global rather than offer-scoped, so a timeline is stripped wherever it
 * appears. Only the timeline goes — the offer itself, the
 * no-obligation/no-repairs differentiators, and closing-speed language
 * ("close in days", "as few as 7 days", "7-14 days") are preserved.
 */

import { sanitizeContactInfo } from "@/lib/shared/phone";

/**
 * Prepositions and hedges that introduce a timeline. They are consumed
 * together with the timeline so removal never strands "in" / "within" /
 * "often" on its own.
 */
const TIMELINE_PREP = String.raw`(?:in|within|as\s+little\s+as|less\s+than|under|after)`;

/** An hour-based time unit. */
const HOURS = String.raw`(?:hours|hrs|hour)\b`;

/** A day-based time unit. */
const DAYS = String.raw`days?\b`;

const BARE_24H = String.raw`\b24[\s\u00a0-]?${HOURS}`;
const BARE_24_48H = String.raw`\b24[\s\u00a0]*(?:-|–|—|to)[\s\u00a0]*48[\s\u00a0-]?${HOURS}`;
const WITHIN_A_DAY = String.raw`\bwithin[\s\u00a0]+(?:a|one|1)[\s\u00a0]+${DAYS}`;
const SAME_DAY = String.raw`\b(?:often[\s\u00a0]+)?same[\s\u00a0-]*${DAYS}`;

/** The prepositional form of the hour-based timelines, so the preposition goes too. */
const PREPOSITIONAL_24H = String.raw`\b${TIMELINE_PREP}\s+${BARE_24H}`;
const PREPOSITIONAL_24_48H = String.raw`\b${TIMELINE_PREP}\s+${BARE_24_48H}`;

/**
 * Fast path: if none of these can match there is nothing to do. Mirrors the
 * removal rules one-for-one — a missed pattern here would silently skip a
 * string that the rules below would otherwise have cleaned.
 */
const CLAIM_PROBE = new RegExp(
  [BARE_24H, BARE_24_48H, WITHIN_A_DAY, SAME_DAY, String.raw`\b24[\s\u00a0-]?hrs\b`].join("|"),
  "i"
);

const COPY_RULES: [RegExp, string][] = [
  // Dangling conjunction: "within 24 hours, and close" → "and close"
  [new RegExp(`${PREPOSITIONAL_24H},[ \\t]+(?=(?:and|or|but)\\b)`, "gi"), ""],
  [new RegExp(`${PREPOSITIONAL_24_48H},[ \\t]+(?=(?:and|or|but)\\b)`, "gi"), ""],
  [new RegExp(PREPOSITIONAL_24H, "gi"), ""],
  // Range before bare 24h: "as little as 24-48 hours" must not leave "48 hours".
  [new RegExp(PREPOSITIONAL_24_48H, "gi"), ""],
  // Bare forms: "24-hour response", "24 hours", "24-48 hours", "within a day",
  // "often same-day".
  [new RegExp(BARE_24_48H, "gi"), ""],
  [new RegExp(BARE_24H, "gi"), ""],
  [new RegExp(WITHIN_A_DAY, "gi"), ""],
  [new RegExp(SAME_DAY, "gi"), ""],
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
  // A separator dash stranded before punctuation: "offer – often same-day." → "offer."
  // A dash mid-sentence that still introduces real copy ("team — close in 7
  // days") is followed by a word, not punctuation, so it survives.
  [/[-–—][ \t]*(?=[.,;:!?])/g, ""],
  // "offer ." / "offer ," / "offer ;"
  [/[ \t]+([.,;:!?])/g, "$1"],
  // Double punctuation introduced by removing a trailing clause.
  [/([.,;:!?])[ \t]*(?=[.,;:!?])/g, "$1"],
  // Chained preposition: "in as little as 24 hours" / "in less than 24 hours"
  // / "home in as little as 24-48 hours – no showings" loses the phrase but
  // leaves the first preposition stranded before the stop or the dash.
  [/[ \t]+(?:in|within|under|after|as\s+little\s+as|less\s+than)(?=[ \t]*(?:[.,;:!?]|[-–—]))/g, ""],
  // Collapse the gap the removed phrase sat in, plus any leading/trailing
  // space it left on the line. Not \s — newlines are meaningful in markdown.
  [/[ \t]{2,}/g, " "],
  [/[ \t]+$/gm, ""],
  [/^[ \t]+/, ""],
];

/**
 * Remove the offer-timeline promises from a single string. Returns the input
 * untouched if it contains nothing to scrub, or if scrubbing would empty it out
 * entirely.
 */
export function scrubCopy(text: string): string {
  if (!text) return text;
  if (!CLAIM_PROBE.test(text)) {
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
