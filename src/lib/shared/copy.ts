/**
 * Claim-safety scrubbers for marketing copy.
 *
 * The claims being scrubbed are the offer-timeline promises: "in 24 hours",
 * "in as little as 24-48 hours", "within a day" and "same-day". Removal is
 * global rather than offer-scoped, so a timeline is stripped wherever it
 * appears. Only the timeline goes — the offer itself, the
 * no-obligation/no-repairs differentiators, and closing-speed language
 * ("close in days", "as few as 7 days", "7-14 days") are preserved.
 *
 * "Today" is handled differently, because the bare word is legitimate far more
 * often than the timelines above. It is removed only when it qualifies a
 * company promise — an offer, a response/callback, or payment — so
 * "Get a Fair Cash Offer Today" loses the time promise while "Call us today",
 * "USA Today" and "Today's Market" are left alone.
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

/**
 * "Today" is only a claim when it qualifies a company promise, so the patterns
 * are anchored to a promise subject rather than to the bare word. `PROMISE`
 * matches the offer / response / payment thing the time is attached to.
 * `'(?!\u2019?s)'` keeps possessives such as "Today's Market" out of scope.
 */
const PROMISE =
  String.raw`(?:offers?|valuations?|estimates?|responses?|replies|calls?\s+(?:you\s+)?back|texts?\s+(?:you\s+)?back|follow[\s-]?ups?|payments?|payouts?|proceeds|paid|funds|cash\s+in\s+your\s+(?:bank\s+account|pocket))`;

/** "(?!\u2019?s)" — do not treat the possessive "Today's" as a time claim. */
const NOT_POSSESSIVE = String.raw`(?!['\u2019]s)`;

/**
 * Up to four plain words between the promise and "today", so
 * "offer for your home today" still counts. No sentence punctuation is allowed
 * inside the gap, so a claim can never reach across a clause into a later
 * sentence.
 */
const SHORT_GAP = String.raw`(?:[ \t\u00a0]+[\w'’\u2013\u2014-]+){0,4}[ \t\u00a0]*,?[ \t\u00a0]*`;

/**
 * "Get a fair cash offer today", "get paid today", "we will call you back
 * today". Captured so only the time promise is dropped and the offer,
 * response or payment wording survives.
 */
const TODAY_AFTER_PROMISE = String.raw`\b(${PROMISE})\b${SHORT_GAP}today\b${NOT_POSSESSIVE}`;

/**
 * Adjectives the generators put in front of the promise noun ("your no-obligation
 * cash offer", "a fair cash estimate"). Bounded to two so the match can never
 * run away from the time claim it is qualifying.
 */
const PROMISE_ADJ = String.raw`(?:cash|fair|no-obligation|confidential|free|quick|fast|solid|firm|real|competitive|personalized|no-strings|no-pressure|custom|best|actual)`;

/**
 * "Today, get your cash offer" / "Today you get an offer" — the promise is what
 * "today" governs, not something the sentence merely mentions later. That is
 * why the promise must sit immediately after a modal and a receive-verb, which
 * keeps "Call us today to discuss your offer" intact ("discuss" is not a
 * receive-verb) while catching "Today you get an offer". Only the time word is
 * consumed so the rest of the sentence survives.
 */
const TODAY_BEFORE_PROMISE = String.raw`\btoday\b${NOT_POSSESSIVE}[ \t\u00a0]*(?:,[ \t\u00a0]*)?(?=(?:(?:we|you|i)[ \t\u00a0]+)?(?:(?:will|can|may|always|never|going[ \t\u00a0]+to|are[ \t\u00a0]+going[ \t\u00a0]+to)[ \t\u00a0]+)?(?:(?:get|getting|receive|receiving|have|having|hear|hearing)[ \t\u00a0]+)?(?:(?:a|an|the|your|our)[ \t\u00a0]+)?(?:${PROMISE_ADJ}[ \t\u00a0]+){0,2}(?:${PROMISE})\b)`;

/**
 * "We respond today", "we will get you your offer today" — a first-person
 * promise verb with no other promise noun. Anchored on a first-person subject
 * so visitor-directed imperatives ("Call us today", "Text us today") survive
 * while "We text you back today" is caught.
 */
const WE_PROMISE_TODAY = String.raw`\b((?:we|i|tarek(?:['\u2019]s)?\s+team)\b[\s\u00a0]+(?:will|can|are|do|always)?[\s\u00a0]*(?:respond|reply|reach\s+out|get\s+back|touch\s+base|be\s+in\s+touch|get\s+you\s+your\s+offer|have\s+your\s+offer|send|call|text)[\s\u00a0\w'-\u2019]{0,25})[\s\u00a0]*,?[\s\u00a0]*today\b${NOT_POSSESSIVE}`;

/** The prepositional form of the hour-based timelines, so the preposition goes too. */
const PREPOSITIONAL_24H = String.raw`\b${TIMELINE_PREP}\s+${BARE_24H}`;
const PREPOSITIONAL_24_48H = String.raw`\b${TIMELINE_PREP}\s+${BARE_24_48H}`;

/**
 * Fast path: if none of these can match there is nothing to do. Mirrors the
 * removal rules one-for-one — a missed pattern here would silently skip a
 * string that the rules below would otherwise have cleaned.
 */
const CLAIM_PROBE = new RegExp(
  [
    BARE_24H,
    BARE_24_48H,
    WITHIN_A_DAY,
    SAME_DAY,
    TODAY_AFTER_PROMISE,
    TODAY_BEFORE_PROMISE,
    WE_PROMISE_TODAY,
    String.raw`\b24[\s\u00a0-]?hrs\b`,
  ].join("|"),
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
  // Contextual "today": the time promise goes, the promise itself stays.
  [new RegExp(TODAY_AFTER_PROMISE, "gi"), "$1"],
  [new RegExp(WE_PROMISE_TODAY, "gi"), "$1"],
  [new RegExp(TODAY_BEFORE_PROMISE, "gi"), ""],
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
