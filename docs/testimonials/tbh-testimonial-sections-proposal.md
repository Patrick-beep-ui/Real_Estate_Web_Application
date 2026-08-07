# Proposal: Primary Testimonial Section (Spotlight) + Testimonial Management Module

**Presented under the TBH Research-First Process SOP (Step 3 — Present the Why)**

| Field | Detail |
|---|---|
| **Document** | Proposal — adopt the Spotlight testimonial section as the primary on-site social proof block, backed by a new testimonial management module |
| **Owner** | Developer (website change) |
| **Applies to** | Homepage testimonial placement; repeated testimonial blocks across pages; admin workflow for managing testimonials |
| **Compliance** | TBH Research-First Process SOP — Steps 1–4 completed, Step 5 (QA) checklist included, ready for Step 6 (Tarek Review) |
| **Status** | Submitted for approval (Diane/Madz) → Tarek sign-off |

---

## 2. Recommendation Summary

**Adopt the Spotlight testimonial section as the single primary testimonial block on the homepage**, placed mid-page after "How It Works." Remove the duplicate Featured and Editorial sections from the homepage (they currently run back-to-back for testing). Support this with the new **Testimonial Management module** at `/admin/testimonials`, which lets non-technical team members add, curate, assign, and preview testimonials without touching code.

The recommendation is grounded in 2026 conversion research (Step 1), an audit of the current site (Step 2), and the fact that the build (Step 4) is already complete and QA-checked (Step 5).

---

## 3. Step 1 — Research First

The question asked: *"Where should video testimonials live on this site for the highest conversion, based on factual 2026 case studies?"*

### 3.1 Key findings (2026)

| Finding | Data | Source |
|---|---|---|
| Video testimonials beat text | **+25–34% avg lift**, up to **+80%** in B2B; video converts ~80% better than text | Testimonial Star / Genesys Growth 2026; Shoutjar 2026 |
| Video testimonial lift by vertical | **B2C +61%**, B2B +39% | Zebracat 2026 |
| Placement beats volume | Same testimonial moved above the fold: **+63%** CVR (3.91% → 6.38%). Small placement changes yield **10–20%** differences | UserEvidence; Shoutjar 2026 |
| Proof near the action | Testimonials near a primary CTA: **+24–25%** clicks; near checkout: **+24%** purchases | Zebracat 2026; ConversionLab 2026 |
| "Someone like me" wins | Visitors who self-select proof matching their situation convert far better; GlowBotanics saw **42% of visitors use filters**, 38% play rate, +41% page CVR from a filterable video library | GlowBotanics case study, Jan 2026; Stackla/Nosto 2026 |
| Don't stack sections | "One curated section is compelling. Two or three feels like over-compensation." | Shopify metaobjects guide 2026 |
| Above-the-fold / trust bar | Aggregate ratings + logo strip just below hero reduce early bounce; below-fold social proof is seen by <50% of visitors | NN/g eye-tracking; ReputationRiser 2026 |
| Volume balance | 3–6 strong homepage testimonials; quality over quantity | Shoutjar; ReputationRiser 2026 |
| Video behavior | Peak engagement ≈60s (Wistia, 13M videos); short clips; **never auto-play** — let the visitor choose | Wistia; Shopify guide 2026 |

### 3.2 How the research maps to Spotlight

- **"Pick a Story That Sounds Like Yours" rail = the "someone like me" pattern.** Visitors self-select the situation closest to theirs (cash sale, divorce, probate, etc.), which is the highest-performing social-proof pattern in the 2026 data. The rail also **absorbs new testimonial-tracker entries without a layout change** — the section scales as more sellers share stories.
- **Mid-page placement after "How It Works" = the relevance intent stage.** Research: top of page answers "can I trust this company?" (handled by the hero + media logos strip), mid-page answers "will this work for someone like me?" — which is exactly what Spotlight's rail does.
- **Trust bar built into the section** (Google rating, BBB, Homes Purchased) reinforces credibility at the exact moment of comparison.
- **Visitor-initiated playback** — no auto-play, matching the research and the SOP ("let visitors choose to play").
- **One section, not three.** The current homepage stacks Spotlight + Featured + Editorial, which the 2026 research explicitly flags as over-compensation. Using Spotlight alone concentrates trust instead of diluting it.

---

## 4. Step 2 — AI Audit (of the current site)

Audit scope: homepage, About page, city/market pages, and the testimonial data path, against the SOP quality checklist and 2026 placement research.

### 4.1 Strengths found

- **Above-the-fold trust present:** media-logos strip sits directly below the hero.
- **Mid-page testimonial position already correct in intent terms.**
- **Admin-only write access** on the testimonial data (RLS) — no open public writes.

### 4.2 Gaps found

| # | Gap | Severity | Resolution status |
|---|---|---|---|
| G1 | **Homepage stacks three testimonial sections** back-to-back (Spotlight + hr + Featured + hr + Editorial) — flagged by 2026 research as over-compensation | High | Fix in rollout (keep only Spotlight) |
| G2 | **Prod Alice video URL is broken** — points to a file that does not exist (404), so a visitor would see a black box, a direct SOP checklist violation | High | QA fix identified (data hygiene) |
| G3 | **Burned-in captions on the actual video not yet verified** — SOP requires on-screen text for ~80% muted viewers | Medium | To verify before Tarek review |
| G4 | **Cross-page inconsistency:** homepage = Spotlight, About + city/market pages = a different block (TestimonialCards) | Medium | Standardize on Spotlight per SOP "same format and location" |
| G5 | **No proof element adjacent to the final CTA** (BottomCTA) — research: +24% near-CTA lift | Low | Optional follow-up |

The audit is the basis for the build and for the rollout, not a guess.

---

## 5. Step 3 — Present the Why

### 5.1 Why Spotlight and not Featured or Editorial

- **Spotlight** — self-selection rail; absorbs new stories with no layout change; trust bar; supports video *and* written stories; strongest fit to the 2026 "someone like me" and "absorbs growing library" findings. Chosen as the primary section.
- **Featured** — a compact 1-video + 2-written card. Good, but it is a *static* layout that requires manual re-curation as the library grows and offers no visitor self-selection.
- **Editorial** — long-form full story rows. 2026 research: full stories belong on a dedicated page, not the homepage mid-scroll, and long quotes underperform on homepages. Kept in the codebase for a future dedicated testimonials/case-studies page.

### 5.2 Why the admin module makes this sustainable

The testimonial management module is what turns a one-time placement into a repeatable workflow the team can operate without a developer:

- **Create / edit / delete** testimonials (video or written) from `/admin/testimonials`.
- **Curate per section:** assign which testimonials appear in each section and their order, with a **live preview** that updates as you edit — no code, no deploy.
- **Self-service media uploads** to storage with validation and clear error messages, plus **automatic broken-URL warnings** so a black box can't silently ship.
- **Status workflow** (draft / published / archived) and a **featured** flag.
- **Reliability guards:** if a video or thumbnail ever fails, the public site shows a graceful fallback (initials / "Video unavailable" + retry), never a broken element. Covered by 142 passing tests.

This means new testimonials from the tracker flow into the live section through the admin UI, keeping the page fresh and compliant without a developer in the loop.

---

## 6. Step 4 — Build (what exists)

### 6.1 Sections (DB-driven)

- `TestimonialsSpotlight` — seller rail + spotlight card + trust bar + Text/Call CTA. Reads from the database, falls back to curated static stories only when empty.
- `TestimonialsFeatured` — 1 video + 2 written in a bordered card.
- `TestimonialsEditorial` — long-form consent-signed story rows.
- `VideoStoryFrame` — shared video player with broken-video ("Video unavailable" + Retry) and broken-thumbnail (initials) fallbacks.

### 6.2 Admin module (`/admin/testimonials`)

- **List tab:** stats cards, search, status/scenario filters, sortable table, featured toggle, create/edit/delete.
- **Editor:** video ↔ written switch, validated video (≤100MB) and thumbnail (≤5MB) uploads, storage error messages, broken-URL health warnings, points, status, featured.
- **Sections tab:** per-section assignment, ordering, search/available list, **live preview**, save/reset.
- **Security:** admin-only INSERT/UPDATE/DELETE (RLS) on testimonials for both production and testing; public read; admin-only storage uploads.

### 6.3 Data model

- `testimonials` — the stories (kind, status, media URLs, content, featured flag, ordering).
- `testimonial_section_assignments` — which testimonials appear in which section, in what order.

### 6.4 Test coverage

- 142 passing tests (2 skipped) covering the fallbacks, upload validation, and URL-health logic; lint clean for new code.

---

## 7. Step 5 — QA Against the Standard

| Check | Standard | Status |
|---|---|---|
| **Captions / on-screen text** | Every video has burned-in captions (~80% watch muted) | ⚠ To verify on the live video asset |
| **Video cover / thumbnail** | No black box before playing — real cover image required | ✅ Thumbnails enforced; initials fallback if missing. ⚠ G2 (broken prod URL) must ship fixed |
| **Cross-page consistency** | Same format + location across homepage, city pages, property pages | ⚠ G4 — standardized on Spotlight in rollout |
| **Placement backed by research** | Position justified by current best-practice research, not convention | ✅ This proposal (Section 3) |
| **Reliability** | Clear fallbacks, tested end-to-end, no silent breakage | ✅ Fallbacks + 142 tests; admin-only RLS |

**Honest status note:** per the SOP's "perfect, not functional" bar, G1 (de-clutter), G2 (broken prod URL fix), and G3 (captions verification) are open items that must be closed **before** this reaches Tarek for live review — they are scheduled in the rollout below, not hidden.

---

## 8. Step 6 — Tarek Review (what to check live)

Once open items are closed, Tarek reviews on the actual page:

1. Homepage — Spotlight section mid-page after "How It Works," no duplicate testimonial sections.
2. Click a story in the rail — video plays on click (no auto-play), thumbnail shows a real image (no black box), captions visible.
3. Trust bar (Google / BBB / Homes Purchased) renders correctly.
4. Mobile — rail and spotlight card stack cleanly.
5. Admin — Sections tab: assign/reorder a testimonial, watch the live preview update.

---

## 9. Rollout (phased)

| Phase | Action | Owner |
|---|---|---|
| 0 | Approve this proposal | Diane/Madz → Tarek |
| 1 | De-clutter homepage to Spotlight only; fix prod Alice video URL (G2) | Developer |
| 2 | Verify burned-in captions on video asset (G3); standardize city/About pages on Spotlight (G4) | Developer / Video |
| 3 | Final QA against Section 5 checklist | Diane/Madz |
| 4 | Tarek live review | Tarek |

---

## 10. Sources

- Testimonial Star / Genesys Growth — social proof conversion stats, 2026
- Zebracat — video testimonial dataset, 2026
- UserEvidence — testimonial repositioning test (3.91% → 6.38%)
- Shoutjar — "How to Display Testimonials on Your Website" (2026)
- ConversionLab — "The best place for a testimonial is next to the button" (2026)
- VideoTestimonials — GlowBotanics UGC video case study (Jan 2026)
- Shopify metaobjects guide — "Social Proof on the Homepage" (2026)
- ReputationRiser — "Homepage vs Service Page: Where Reviews Work Best" (2026)
- Nielsen Norman Group — eye-tracking / trust-signal placement research
- Wistia — 13M-video engagement analysis
- Bazaarvoice / PowerReviews — video vs. text review conversion data
