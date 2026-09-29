/**
 * Regression tests for the removal of the offer-timeline claims.
 *
 * Contract being locked in:
 *   1. Every banned offer timeline is stripped from every string a visitor
 *      READS, across every phrasing the generators produce: a 24-hour deadline
 *      (in / within / as little as / less than / under / after, `24 hours` /
 *      `24hrs` / `24-hour`), a 24-48 hour range (`24-48`, `24–48`, `24—48`,
 *      `24 to 48`), a sub-48-hour promise (`within a day`, `within one day`,
 *      `within 1 day`) and the same-day hedges (`same day`, `same-day`,
 *      `often same-day`).
 *   2. Removal is global, not offer-scoped: a banned timeline goes wherever it
 *      appears.
 *   3. "Today" is scrubbed only when it qualifies a company promise — an offer,
 *      a response/callback, or payment. "Call us today", "USA Today" and
 *      "Today's Market" are legitimate and must survive untouched, so the
 *      pattern is anchored to a promise noun rather than to the bare word.
 *   4. Only the timeline goes. The offer itself and closing-speed claims
 *      ("close in as little as 7 days", "7-14 days", "within 7 days") survive —
 *      this is a copy edit, not a de-emphasis of the business.
 *   5. Removal does not damage the surrounding text: Oxford commas,
 *      currency, markdown paragraph breaks and inline HTML are preserved, and
 *      no stranded preposition, "often" hedge or separator dash is left behind.
 *   6. The stored Supabase rows are never mutated. The scrub is render-time,
 *      which is why `scrubBlogPost` and `mergeContent` return copies — and
 *      `scrubBlogPost` scrubs an allowlist so a hyphenated `slug` like
 *      `get-a-cash-offer-in-24-hours` cannot be rewritten into a dead URL.
 *   7. No customer-facing source file reintroduces any of the claims (see the
 *      scan at the bottom), and the generation prompts explicitly forbid them
 *      so the next regeneration does not put them back.
 */

import fs from "fs";
import path from "path";
import ts from "typescript";
import { scrubCopy, sanitizeCopy } from "@/lib/shared/copy";
import { scrubBlogPost, scrubBlogPosts } from "@/lib/blog/utils";
import { PHONE } from "@/lib/shared/phone";
import { mergeContent } from "@/hooks/content/useGeneratedContent";
import type { SituationConfig } from "@/lib/data/situations";
import type { GeneratedContent } from "@/lib/content/types";

// ── 1. Every phrasing we have ever shipped gets stripped ───────────────────

/** Real strings lifted from situations.ts, the section components, and DB rows. */
const CLAIM_STRINGS = [
  "Get a fair cash offer in 24 hours. No fees. No repairs. No obligation. Just text or call.",
  "Cash offer in 24 hours. Close in days.",
  "Get a cash offer within 24 hours. Close on your timeline. No repairs, no fees, no hassle.",
  "Get a fair offer in as little as 24 hours.",
  "Send your address and get a fair proposal in less than 24 hours.",
  "Get a fair cash offer from Tarek's team after 24 hours.",
  "Free, no-obligation offer within 24 hours",
  "24-hour response, Tarek's personal team",
  "Get a cash offer within 24hrs and close in 7 days.",
  "We Get You a Cash Offer in 24 Hours",
  "Get a cash offer (within 24 hours).",
  "Get your free, no-obligation cash offer in 24 hours. 100% confidential.",
  "We'll call you within 24 hours with a fair, no-obligation cash offer.",
  "Behind on payments, got fair cash offer in 24 hours. Closed in 9 days. Saved my credit.",
  "Get a fair cash offer within 24 hours \u2013 end the stress today.",
  // 24-48 hour range: hyphen and "to" separators, plus the en dash.
  "Get a fair cash offer for your Fresno home in as little as 24-48 hours \u2013 no showings, no agents, no hassle.",
  "Get a fair cash offer in 24-48 hours.",
  "Get a fair cash offer in 24\u201348 hours.",
  "Get a fair cash offer in 24 to 48 hours.",
  // Sub-48-hour promises.
  "Get a fair, no-obligation cash offer for your Raleigh-Durham rental property within a day.",
  "Get a fair cash offer for your fire-damaged Charlotte Metro home within one day.",
  "Get a no-obligation cash offer \u2013 often same-day.",
  "We text you back the same day.",
  // "today" is only a claim when it qualifies a promise.
  "Get a Fair Cash Offer Today.",
  "Get your confidential, no-obligation cash offer today",
  "We will call you back today.",
  "Get paid today, not in 30 days.",
];

/** Every banned timeline must be gone, whichever wording it used. */
const CLAIM_PATTERNS = [
  /24[\s\u00a0-]?(?:hours|hrs|hour)/i,
  /24[\s\u00a0]*(?:-|\u2013|\u2014|to)[\s\u00a0]*48[\s\u00a0-]?(?:hours|hrs|hour)/i,
  /within[\s\u00a0]+(?:a|one|1)[\s\u00a0]+days?\b/i,
  /\bsame[\s\u00a0-]*days?\b/i,
  // "today" is only a claim when it qualifies a promise.
  /\boffers?\b[\s\S]{0,40}\btoday\b/i,
  /\b(?:we|i)\b[\s\S]{0,40}\btoday\b/i,
  /\bpaid\b[\s\S]{0,40}\btoday\b/i,
];

describe("scrubCopy removes the 24-hour offer timeline", () => {
  it.each(CLAIM_STRINGS)("strips the claim from %j", (input) => {
    const output = scrubCopy(input);
    for (const pattern of CLAIM_PATTERNS) {
      expect(output).not.toMatch(pattern);
    }
  });

  it("removes the preposition with the phrase so no stranded 'in' survives", () => {
    expect(scrubCopy("Get a fair offer in 24 hours.")).toBe("Get a fair offer.");
    expect(scrubCopy("Get a fair offer in as little as 24 hours.")).toBe("Get a fair offer.");
    expect(scrubCopy("We will respond less than 24 hours.")).toBe("We will respond.");
  });

  it("drops a comma that the removal would otherwise strand", () => {
    expect(
      scrubCopy("make a cash offer within 24 hours, and close on your timeline")
    ).toBe("make a cash offer and close on your timeline");
  });

  it("keeps a comma the claim did not create", () => {
    expect(scrubCopy("Get a fair offer in 24 hours, close in as few as 7 days.")).toBe(
      "Get a fair offer, close in as few as 7 days."
    );
  });

  it("does not strand the preposition, hedge or dash around the new timelines", () => {
    expect(
      scrubCopy("Get a fair cash offer for your Fresno home in as little as 24-48 hours \u2013 no showings.")
    ).toBe("Get a fair cash offer for your Fresno home \u2013 no showings.");
    expect(scrubCopy("Get a cash offer for your rental property within one day!")).toBe(
      "Get a cash offer for your rental property!"
    );
    expect(scrubCopy("Get a no-obligation cash offer \u2013 often same-day.")).toBe(
      "Get a no-obligation cash offer."
    );
  });

  it("keeps the copy that trails the removed claim", () => {
    expect(
      scrubCopy(
        "Get a fair cash offer for your fire-damaged Charlotte Metro home within one day. No Repairs, No Cleaning: we buy your property strictly as-is."
      )
    ).toBe(
      "Get a fair cash offer for your fire-damaged Charlotte Metro home. No Repairs, No Cleaning: we buy your property strictly as-is."
    );
  });

  it("removes a promise-qualified 'today' but keeps the promise and the CTA", () => {
    expect(scrubCopy("Get a Fair Cash Offer Today.")).toBe("Get a Fair Cash Offer.");
    expect(scrubCopy("We will call you back today.")).toBe("We will call you back.");
    expect(scrubCopy("Get paid today, not in 30 days.")).toBe("Get paid, not in 30 days.");
    // A visitor-facing "Call us today" in the same string is untouched.
    expect(scrubCopy("Get your offer today. Call us today if you have questions.")).toBe(
      "Get your offer. Call us today if you have questions."
    );
  });

  it("leaves 'today' alone when it is a call to action, a brand or editorial", () => {
    for (const text of [
      "Call us today \u2014 time is critical.",
      "Speak with our local specialist today.",
      "USA Today",
      "Why Cash Buyers Are More Active Than Ever in Today's Market",
    ]) {
      expect(scrubCopy(text)).toBe(text);
    }
  });
});

// ── 2. Only the timeline goes — the business is not de-emphasized ─────────

describe("scrubCopy preserves everything it should", () => {
  it("keeps the offer itself", () => {
    expect(scrubCopy("Get a fair cash offer in 24 hours.")).toContain("cash offer");
  });

  it("keeps closing-speed copy that is not the 24-hour claim", () => {
    expect(
      scrubCopy("Tarek's team closes in as little as 7 days. Cash offer in 24 hours.")
    ).toBe("Tarek's team closes in as little as 7 days. Cash offer.");
    expect(scrubCopy("Close in as few as 7 days \u2014 fast enough to stop most foreclosures.")).toBe(
      "Close in as few as 7 days \u2014 fast enough to stop most foreclosures."
    );
  });

  it("does not touch 24/7, other non-hour 24 usages, or a standalone 48", () => {
    for (const text of [
      "24/7 Availability",
      "Drip health - last 24h",
      "since24h",
      "Over 48 hours of paperwork? We handle it.",
    ]) {
      expect(scrubCopy(text)).toBe(text);
    }
  });

  it("keeps closing timelines that are day counts, not day-speed promises", () => {
    for (const text of [
      "Close in 7-14 Days: we close on your schedule.",
      "Close in as little as one week, putting cash in your hand sooner.",
      "Within 7 days we can have you closed.",
    ]) {
      expect(scrubCopy(text)).toBe(text);
    }
  });

  it("leaves claim-free copy byte-identical", () => {
    const text = "100% Confidential \u00b7 No Obligation \u00b7 Free Cash Offer";
    expect(scrubCopy(text)).toBe(text);
  });

  it("returns the input unchanged when scrubbing would empty it", () => {
    expect(scrubCopy("24 hours")).toBe("24 hours");
  });

  it("handles empty input", () => {
    expect(scrubCopy("")).toBe("");
  });
});

// ── 3. Removal must not damage surrounding structure ───────────────────────

describe("scrubCopy preserves text structure", () => {
  it("keeps Oxford commas elsewhere in the same string", () => {
    // A blanket "remove the comma before and" rule would eat this one, which
    // is why the dangling-comma case is detected by adjacency instead.
    expect(
      scrubCopy(
        "Skip the hassle of listings, repairs, and months of waiting. Get a fair cash offer from Tarek's team within 24 hours \u2014 close on your timeline."
      )
    ).toBe(
      "Skip the hassle of listings, repairs, and months of waiting. Get a fair cash offer from Tarek's team \u2014 close on your timeline."
    );
  });

  it("keeps currency, decimals and numeric ranges intact", () => {
    expect(scrubCopy("Offer in 24 hours. Keep the $1,000.00 you have. 3-5 days is fine.")).toBe(
      "Offer. Keep the $1,000.00 you have. 3-5 days is fine."
    );
  });

  it("keeps markdown paragraph breaks and list markers", () => {
    const input = "Para one mentions a cash offer in 24 hours.\n\nPara two stays.\n\n- Bullet in 24 hours\n- Another";
    expect(scrubCopy(input)).toBe("Para one mentions a cash offer.\n\nPara two stays.\n\n- Bullet\n- Another");
  });

  it("keeps inline HTML intact", () => {
    expect(scrubCopy("<p>Get a cash offer in 24 hours.</p><p>Second <strong>para</strong> stays.</p>")).toBe(
      "<p>Get a cash offer.</p><p>Second <strong>para</strong> stays.</p>"
    );
  });

  it("is idempotent", () => {
    const once = scrubCopy(CLAIM_STRINGS[0]);
    expect(scrubCopy(once)).toBe(once);
  });
});

// ── 4. Render-time scrub, never a data migration ──────────────────────────

describe("scrubBlogPost", () => {
  it("scrubs the copy fields a visitor or crawler sees", () => {
    const post = {
      title: "Cash Offer in 24 Hours",
      seo_title: "Fast, Fair Offer in 24 Hours",
      excerpt: "Get a fair offer in 24 hours.",
      meta_description: "Get a fair offer within 24 hours.",
      content: "## The Offer\n\nYou get a cash offer in 24 hours.\n\n## Next\n\nCall us.",
    };
    const scrubbed = scrubBlogPost(post);

    expect(scrubbed.title).toBe("Cash Offer");
    expect(scrubbed.seo_title).toBe("Fast, Fair Offer");
    expect(scrubbed.excerpt).toBe("Get a fair offer.");
    expect(scrubbed.meta_description).toBe("Get a fair offer.");
    expect(scrubbed.content).toBe("## The Offer\n\nYou get a cash offer.\n\n## Next\n\nCall us.");
  });

  it("does NOT scrub a hyphenated slug — that would break the URL", () => {
    const post = { slug: "get-a-cash-offer-in-24-hours", canonical_url: "/blog/get-a-cash-offer-in-24-hours" };
    const scrubbed = scrubBlogPost(post);
    expect(scrubbed.slug).toBe("get-a-cash-offer-in-24-hours");
    expect(scrubbed.canonical_url).toBe("/blog/get-a-cash-offer-in-24-hours");
  });

  it("never mutates the input row", () => {
    const post = { title: "Cash Offer in 24 Hours" };
    scrubBlogPost(post);
    expect(post.title).toBe("Cash Offer in 24 Hours");
  });

  it("returns the same reference when nothing needed scrubbing", () => {
    const post = { title: "Cash Offer" };
    expect(scrubBlogPost(post)).toBe(post);
  });

  it("preserves order and length across a list", () => {
    const posts = [{ title: "Offer in 24 hours" }, { title: "Clean" }];
    const scrubbed = scrubBlogPosts(posts);
    expect(scrubbed).toHaveLength(2);
    expect(scrubbed[0].title).toBe("Offer");
    expect(scrubbed[1].title).toBe("Clean");
  });
});

describe("mergeContent", () => {
  const baseSituation = {
    slug: "foreclosure",
    label: "Foreclosure",
    heroImage: "/hero.jpg",
    headline: "Static headline",
    subheadline: "Static subheadline",
    bodyParagraphs: ["Static body."],
    bullets: ["Static bullet."],
    videoCaptionLines: [],
    beforeTitle: "Before",
    traditionalPathBody: "Traditional body.",
    afterTitle: "After",
    directPathBody: "Direct body.",
    warningTitle: "Warning",
    warningBody: "Warning body.",
    faqs: [{ q: "How fast?", a: "We call you within 24 hours." }],
    urgencyLine: "Static urgency.",
    whyTarekBody: [],
    finalCtaHeadline: "CTA",
    finalCtaSubline: "Sub",
    smsPrefilledText: "",
    metaTitle: "Static meta title",
    metaDescription: "Static meta description",
  } as unknown as SituationConfig;

  const dbContent = {
    headline: "Get a cash offer in 24 hours",
    subheadline: "No repairs. Offer in 24 hours.",
    body_paragraphs: ["We make a cash offer in 24 hours."],
    bullets: ["Fair offer in 24 hours"],
    faqs: [{ q: "How fast?", a: "An offer within 24 hours, and close in 7 days." }],
    before_title: "Before",
    before_body: "Traditional path in 24 hours.",
    after_title: "After",
    after_body: "Direct path in 24 hours.",
    warning_title: "Warning",
    warning_body: "Careful.",
    urgency_line: "Get an offer in 24 hours!",
    final_cta_headline: "CTA in 24 hours",
    final_cta_subline: "Sub",
    meta_title: "Meta title in 24 hours",
    meta_description: "Meta description in 24 hours.",
    why_tarek_body: ["Why in 24 hours"],
    video_caption_lines: ["Caption in 24 hours"],
    sms_prefilled_text: "Hi, I want an offer in 24 hours",
  } as unknown as GeneratedContent;

  it("scrubs stored DB content on the way to the page", () => {
    const merged = mergeContent(baseSituation, dbContent);

    expect(merged.headline).toBe("Get a cash offer");
    expect(merged.subheadline).toBe("No repairs. Offer.");
    expect(merged.bodyParagraphs).toEqual(["We make a cash offer."]);
    expect(merged.bullets).toEqual(["Fair offer"]);
    expect(merged.urgencyLine).toBe("Get an offer!");
    expect(merged.metaTitle).toBe("Meta title");
    expect(merged.metaDescription).toBe("Meta description.");
    expect(merged.smsPrefilledText).toBe("Hi, I want an offer");
    expect(merged.videoCaptionLines).toEqual(["Caption"]);
  });

  it("scrubs FAQ answers reached through the nested { q, a } shape", () => {
    const merged = mergeContent(baseSituation, dbContent);
    // The removal also takes the comma, which is what it was doing there.
    expect(merged.faqs[0].a).toBe("An offer and close in 7 days.");
  });

  it("scrubs skipFields too — the static value is still rendered copy", () => {
    const merged = mergeContent(
      { ...baseSituation, traditionalPathBody: "Listed for 90 days, offer in 24 hours." } as SituationConfig,
      dbContent,
      ["traditionalPathBody"]
    );
    expect(merged.traditionalPathBody).toBe("Listed for 90 days, offer.");
  });

  it("scrubs nested noEquity copy that no pick() touches", () => {
    const merged = mergeContent(
      {
        ...baseSituation,
        noEquity: { heading: "No equity?", body: "Still a cash offer in 24 hours.", options: [{ label: "Option", body: "Offer in 24 hours." }] },
      } as unknown as SituationConfig,
      dbContent
    );
    expect(merged.noEquity?.body).toBe("Still a cash offer.");
    expect(merged.noEquity?.options[0].body).toBe("Offer.");
  });

  it("scrubs the static fallback when there is no DB content", () => {
    const merged = mergeContent(
      { ...baseSituation, headline: "Cash offer in 24 hours" } as SituationConfig,
      null
    );
    expect(merged.headline).toBe("Cash offer");
  });

  it("scrubs the promise-qualified 'today' claim from DB and static content alike", () => {
    const merged = mergeContent(
      { ...baseSituation, headline: "Get a Fair Cash Offer Today" } as SituationConfig,
      {
        ...dbContent,
        bullets: ["Get your no-obligation cash offer today"],
        faqs: [{ q: "How fast?", a: "We will call you back today." }],
      } as unknown as GeneratedContent
    );

    // The DB headline wins over the static one, and both are scrubbed.
    expect(merged.headline).toBe("Get a cash offer");
    expect(merged.bullets).toEqual(["Get your no-obligation cash offer"]);
    expect(merged.faqs[0].a).toBe("We will call you back.");

    const staticOnly = mergeContent(
      { ...baseSituation, headline: "Get a Fair Cash Offer Today" } as SituationConfig,
      null
    );
    expect(staticOnly.headline).toBe("Get a Fair Cash Offer");
  });

  it("leaves unrelated fields alone", () => {
    const merged = mergeContent(baseSituation, dbContent);
    expect(merged.slug).toBe("foreclosure");
    expect(merged.label).toBe("Foreclosure");
    expect(merged.heroImage).toBe("/hero.jpg");
  });
});

describe("sanitizeCopy", () => {
  it("applies both the phone canonicalization and the timeline scrub", () => {
    // (949) 678-2174 is the retired number `sanitizeContactInfo` rewrites.
    const output = sanitizeCopy("Call (949) 678-2174 for a cash offer in 24 hours.");
    expect(output).not.toMatch(/24[\s\u00a0-]?(?:hours|hrs|hour)/i);
    expect(output).toBe(`Call ${PHONE.call} for a cash offer.`);
  });
});

// ── 5. Guard against regression ───────────────────────────────────────────

describe("no customer-facing source reintroduces the claim", () => {
  const SRC = path.join(__dirname, "..", "..", "src");

  /**
   * The claim. The optional preposition covers "in 24 hours"; the bare form
   * catches "24-Hour Response" and "24hrs". The 24-48 range, the
   * "within a day" family and the "same-day" hedges are the other banned
   * timelines and are matched with the same rule.
   *
   * The `last` lookbehind is the false-positive guard: the admin dashboard
   * renders "Drip Pipeline Health · Last 24 Hours", which is a reporting
   * window and not an offer timeline. Likewise `24/7`, `since24h` and
   * `w-24 h-7` never reach this pattern.
   */
  const CLAIM = new RegExp(
    [
      String.raw`(?<!last\s)\b(?:(?:in|within|as\s+little\s+as|less\s+than|under|after)\s+)?24[\s\u00a0-]?(?:hours|hrs|hour)\b`,
      String.raw`\b24[\s\u00a0]*(?:-|–|—|to)[\s\u00a0]*48[\s\u00a0-]?(?:hours|hrs|hour)\b`,
      String.raw`\bwithin[\s\u00a0]+(?:a|one|1)[\s\u00a0]+days?\b`,
      String.raw`\b(?:often[\s\u00a0]+)?same[\s\u00a0-]*days?\b`,
      // "today" is only a claim when it qualifies a promise, so the word on
      // its own is deliberately NOT matched. "Call us today", "USA Today" and
      // "Today's Market" must stay out of scope.
      String.raw`\b(?:offers?|valuations?|estimates?|responses?|replies|calls?\s+(?:you\s+)?back|texts?\s+(?:you\s+)?back|payments?|payouts?|proceeds|paid|funds)\b[\s\S]{0,40}\btoday\b`,
      String.raw`\btoday\b(?!['’]s)[\s\S]{0,40}?\b(?:offers?|valuations?|estimates?|responses?|replies|payments?|payouts?|proceeds|paid|funds)\b`,
      String.raw`\b(?:we|i|tarek(?:['’]s)?\s+team)\b[\s\S]{0,40}?\btoday\b`,
    ].join("|"),
    "i"
  );

  /** copy.ts holds the patterns themselves as template literals. */
  const EXEMPT = new Set([path.join(SRC, "lib", "shared", "copy.ts")]);

  function collect(dir: string, out: string[] = []): string[] {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) collect(full, out);
      else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) out.push(full);
    }
    return out;
  }

  /**
   * Pull only the text a visitor can actually read out of a source file, via
   * the real TypeScript parser: string literals, template literal chunks and
   * JSX text. Comments and identifiers are never inspected, so the guard is
   * about shipped copy rather than about the word appearing in a code comment.
   */
  function readableText(file: string): { line: number; text: string }[] {
    const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
    const found: { line: number; text: string }[] = [];
    const line = (node: ts.Node) =>
      source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;

    const visit = (node: ts.Node) => {
      if (
        ts.isStringLiteral(node) ||
        ts.isNoSubstitutionTemplateLiteral(node) ||
        ts.isJsxText(node) ||
        (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node))
      ) {
        found.push({ line: line(node), text: node.text });
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    return found;
  }

  it("has no claim literal in any readable string in src", () => {
    const offenders: string[] = [];
    for (const file of collect(SRC)) {
      if (EXEMPT.has(file)) continue;
      for (const { line, text } of readableText(file)) {
        if (CLAIM.test(text)) {
          offenders.push(`${path.relative(SRC, file)}:${line} ${text.trim().slice(0, 90)}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("still flags a real regression (sanity check on the guard itself)", () => {
    expect(CLAIM.test("Get a cash offer in 24 hours.")).toBe(true);
    expect(CLAIM.test("We Get You a Cash Offer in 24 Hours")).toBe(true);
    expect(CLAIM.test("24-Hour Response")).toBe(true);
    expect(CLAIM.test("offer within 24hrs")).toBe(true);
    expect(CLAIM.test("Get a fair cash offer in 24-48 hours.")).toBe(true);
    expect(CLAIM.test("Get a fair cash offer in 24 to 48 hours.")).toBe(true);
    expect(CLAIM.test("Get a fair cash offer within a day.")).toBe(true);
    expect(CLAIM.test("Get a fair cash offer within one day.")).toBe(true);
    expect(CLAIM.test("Get a no-obligation cash offer – often same-day.")).toBe(true);
    expect(CLAIM.test("Get a Fair Cash Offer Today.")).toBe(true);
    // And does not fire on the legit survivors:
    expect(CLAIM.test("Drip Pipeline Health · Last 24 Hours")).toBe(false);
    expect(CLAIM.test("24/7 Availability")).toBe(false);
    expect(CLAIM.test("Drip health - last 24h")).toBe(false);
    expect(CLAIM.test('className="w-24 h-7"')).toBe(false);
    expect(CLAIM.test("Close in as little as 7 days")).toBe(false);
    expect(CLAIM.test("Close in 7-14 Days: we close on your schedule.")).toBe(false);
    expect(CLAIM.test("Over 48 hours of paperwork? We handle it.")).toBe(false);
    // "today" is only flagged as a promise, never as the bare word.
    expect(CLAIM.test("Call us today — time is critical.")).toBe(false);
    expect(CLAIM.test("USA Today")).toBe(false);
    expect(CLAIM.test("Why Cash Buyers Are More Active Than Ever in Today's Market")).toBe(false);
  });

  it("has no claim left in the thank-you page (JSX can split the phrase)", () => {
    const page = path.join(SRC, "app", "landing", "thank-you", "page.tsx");
    expect(readableText(page).some(({ text }) => CLAIM.test(text))).toBe(false);
  });
});

describe("generation prompts forbid the claim", () => {
  const ROOT = path.join(__dirname, "..", "..");

  it.each([
    "supabase/functions/ai/prompts/blog-content.ts",
    "supabase/functions/ai/prompts/chat-system.ts",
    "supabase/functions/chat-legacy/index.ts",
  ])("%s tells the model not to promise a 24-hour offer", (relative) => {
    const source = fs.readFileSync(path.join(ROOT, relative), "utf8");
    expect(source).toMatch(/24[- ]hour/i);
    // The only surviving mention must be the prohibition itself.
    expect(source).toMatch(/never/i);
  });

  it.each([
    "supabase/functions/ai/prompts/blog-content.ts",
    "supabase/functions/ai/prompts/chat-system.ts",
    "supabase/functions/chat-legacy/index.ts",
  ])("%s also bans the 24-48, within-a-day, same-day and promise-today variants", (relative) => {
    const source = fs.readFileSync(path.join(ROOT, relative), "utf8");
    expect(source).toMatch(/24[-–]48|24 to 48/i);
    expect(source).toMatch(/within (?:a|one) day/i);
    expect(source).toMatch(/same[- ]day/i);
    // "today" is banned on a promise but explicitly allowed for a CTA.
    expect(source).toMatch(/offer today|today["'.,]/i);
    expect(source).toMatch(/Call us today|Text us today/i);
  });

  it.each([
    "supabase/functions/ai/prompts/blog-content.ts",
    "supabase/functions/ai/prompts/chat-system.ts",
    "supabase/functions/chat-legacy/index.ts",
  ])("%s still allows the closing-speed language the scrubber preserves", (relative) => {
    const source = fs.readFileSync(path.join(ROOT, relative), "utf8");
    expect(source).toMatch(/as little as 7 days/i);
    expect(source).toMatch(/on your timeline/i);
  });
});
