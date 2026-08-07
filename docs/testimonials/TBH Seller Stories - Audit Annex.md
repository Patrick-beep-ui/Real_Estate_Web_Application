# Seller Stories — Design Proposal

**Final audit and recommendation for the single on-site testimonial section**

*Presented under the TBH Research-First Process SOP*

| Field | Detail |
|---|---|
| **Document** | Design Proposal — adopt `TestimonialsSpotlight` ("Seller Stories") as the only testimonial section on the site, operated through the Testimonials admin module |
| **Prepared by** | Patrick Solis — Development (audit run with Claude) |
| **Applies to** | Homepage, About page, and the 544 situation × market landing pages; the `/admin/testimonials` module; the legacy `TestimonialCards` block still live in production |
| **Supersedes** | *Testimonials Placement Audit* (Steps 1–3) and *tbh-testimonial-sections-proposal.md*. Both remain valid as history; where they disagree with this document, this document is current |
| **Verified against** | `staging` @ `26da4a4`, read on 7 August 2026; live rendering of `tarekbuyshouses-testing.vercel.app` and `www.tarekbuyshouses.com` on the same date |
| **Reviewers** | Diane Cruz / Madz Amparo (SOP Step 5) → Tarek El Moussa (SOP Step 6) |
| **Status** | Steps 1–4 complete. **Recommendation ready for approval. Build is not ready for Step 6 live review** — see *Gates* |

---

## 1. The recommendation, in one page

**Approve the design.** `TestimonialsSpotlight` — the "Pick a Story That Sounds Like Yours" section — becomes the single testimonial section on the site, on every page type, replacing the two stacked blocks in production and the three-way test on the homepage. It is the only one of the four layouts that survives a growing story library, that lets a visitor self-select the situation closest to theirs, and that puts Text and Call inside the story card next to the proof.

**Approve the homepage and About rollout now.** Both are single pages, both are already built on staging, and neither depends on anything unfinished.

**Do not merge the market-page rollout to production yet, and do not close the legacy block by deleting it.** The staging branch currently retires `TestimonialCards` without migrating its content. That block holds the only three seller videos on the live site — Rachel, Diane & Kim, and Sara — and they exist nowhere in the testimonials database. Merging as-is would take 544 paid-traffic landing pages from three video testimonials down to one, in service of a compliance fix that a single uncommented line achieves without losing anything.

**The recommended order is therefore:**

1. **Ship the one-line attribution fix to production this week** (`TestimonialCards.tsx:117`). It ends the misattribution on 31 markets immediately and keeps all three videos live while the rest of the work proceeds.
2. **Roll Spotlight to the homepage and About page** once the four blocking gates in Section 8 are closed.
3. **Migrate Rachel, Diane & Kim and Sara into the module** with their real locations and verified captions — then, and only then, retire `TestimonialCards` and roll Spotlight onto market pages with per-page story resolution.

**Three decisions are needed from this document** (Section 11): how consent is represented, whether market pages get per-page resolution before or after rollout, and whether two video sections stay on the same page.

**One correction to our own research is included and is not cosmetic.** Re-checking the Step 1 figures at source found that several do not say what our earlier documents reported — including the "92% watch muted" number. The corrected evidence still supports this recommendation; Section 3.2 states exactly what changed and why.

---

## 2. What was verified, and what was not

**Verified for this audit**

- **Source code at `staging` @ `26da4a4`** — `TestimonialsSpotlight`, `VideoStoryFrame`, `TestimonialCards`, `SellerBadge`, the three page files that mount the section, the six testimonial hooks, the type definitions and row mapper, the admin edit modal and mutations, the sections manager, the Supabase migrations folder, and the test directory.
- **Live rendering** — the staging homepage, the staging Tucson vacant-property page, and the production Phoenix and Tucson vacant-property pages, read on 7 August 2026, including what a crawler or a JavaScript-disabled visitor receives.
- **Research at source** — every figure carried in our prior Step 1 was fetched from the page it was attributed to, and from that page's own cited source where one exists.
- **The FTC Rule on the Use of Consumer Reviews and Testimonials**, 16 CFR Part 465, from the FTC's own guidance and the codified text.

**Not verified — stated plainly rather than assumed**

- **Whether written consent is on file** for any published story, including the three unattributed written quotes still live in production. This is a records question, not a code question.
- **Whether the three market-page YouTube videos carry burned-in captions.** Someone has to watch all three muted. This audit could not establish it, and the previous audit could not either.
- **Who is actually in the one database video.** The record is published under the name *Alice Blackwelder* while the file it points at is named `Angie-Malone.mp4`. See finding N2 — this is the single most important unverified item in the document.
- **Live database contents and dashboard-only access policies** for the production and testing Supabase projects, and whether they still match each other.
- **Rendered mobile behaviour on a physical device.** Mobile findings below are read from the code and from the DOM at a 390px viewport, not from a phone in someone's hand.

---

## 3. Step 1 — Research First

The question asked: *where should seller video testimonials live on this site, in what form, for the highest conversion, based on current evidence?*

### 3.1 What the evidence supports

| Finding | Figure as the source states it | Source | Evidence grade |
|---|---|---|---|
| A single testimonial card with face, name and title outperforms a wall of testimonials | **+14% lift**, described as "high-leverage"; "outperforms walls of testimonials — readers process one anchor better than six" | Digital Applied, *Landing Page Conversion: 2,000 Pages Tested in 2026* | **Vendor benchmark, method stated** — 2,000 pages, Oct 2025–Mar 2026, ≥1,000 sessions per variant, 95% significance. Dataset unaudited; verticals do not include real estate |
| Captions materially change whether a video is watched | **80% of viewers say they are more likely to watch an entire video when captions are present** | Verizon Media + Publicis Media, via 3Play Media | **Primary survey** — n=5,616 U.S. adults, April 2019. Self-reported intent, and seven years old, but it is a real study with a real sample |
| Viewers do watch with the sound off | **50% agree captions are important and they usually watch with sound off** on mobile and desktop | Same study | **Primary survey**, same caveats |
| Rotating content normally fails, *except* when the visitor is actively exploring relevant options | Users "rarely click through the slides of carousels"; advancement decays exponentially. The stated exception: when "users browse through testimonials, reviews, products or their features," and when the component is "meaningfully integrated into a task that a user is trying to complete" | Smashing Magazine, *Usability Guidelines For Better Carousels UX*, synthesising Nielsen Norman Group, Baymard and UXMatters | **Credible UX synthesis** — no single figure; published April 2022, not 2026 |
| Attention concentrates at the top of a page and falls off sharply with depth | Users spent **about 57% of page-viewing time above the fold**, and **74% within the first two screenfuls**; "people still don't scroll a lot" | Nielsen Norman Group eyetracking | **Primary research** — 120 participants, 130,000+ eye fixations |
| Proof placed at the conversion point beats proof placed elsewhere | A video testimonial near the checkout button lifted completed purchases **24%**, against **13%** for the same asset placed elsewhere on the page | Zebracat, via Foundry CRO | **Directional only** — vendor self-attributed, e-commerce checkout, no sample or method published. Do not present as a TBH forecast |

### 3.2 Corrections to our own prior research

Four figures our earlier documents carried do not appear at their cited source, or say something different there. They are withdrawn. The SOP asks for factual case studies; a number that does not survive someone clicking the citation is worse than no number, because it is the part a reader can check.

| Figure we published | What the source actually says | Disposition |
|---|---|---|
| "**92%** of viewers watch muted on mobile" | The cited study reports **50%** usually watch with sound off. The 92% is not in it | **Withdrawn.** Use 50%. The captions requirement does not depend on the higher number — 50% of mobile visitors is already decisive, and the SOP's own bar is independent of either figure |
| "Vertical **9:16** on mobile: **+10–20%**" | Traces to a Google Ads page about **YouTube Shorts ad assets** — "more than 35% increase in conversions on Shorts," and +20% *watch time*. Not landing-page video, and not the stated number | **Withdrawn.** 9:16 remains the right frame for phone-first viewing, but as a craft judgment, not a cited conversion figure |
| "Named, specific social proof beats vague: **+22%**" | The +22% belongs to a B2B element — a named-customer count, "8 of the Fortune 50" | **Withdrawn.** The defensible figure for a named, pictured seller is the **+14%** single-card result above |
| "B2C video testimonials vs. none: **+61%**" | Appears only as one vendor citing itself, with no sample, method or date | **Withdrawn as a quantitative claim.** That video testimonials outperform text-only proof is not seriously contested; this particular percentage is not citable |

One further limit, stated honestly: **no published test was found, in 2026 or earlier, on whether a selectable or filterable testimonial gallery converts better than a static one.** The "someone like me" self-selection pattern that this design is built around is supported by reasoning and by the carousel-exception literature — not by a measured result. It should be described as a well-reasoned bet we intend to measure, and Section 10 includes what to measure.

### 3.3 What the evidence actually asks a design to do

Stripped of contested percentages, the defensible findings converge on five requirements. All five are design constraints, and the recommendation in Section 5 is argued against them.

1. **One curated section, not a wall or a stack.** Concentrated proof beats volume.
2. **Captions on every video, always.** Half of mobile viewers have the sound off.
3. **Proof at the conversion point.** The call to action belongs beside the story, not two sections below it.
4. **Depth costs attention.** Anything below the second screenful is seen by a shrinking fraction of visitors, so the first story shown carries most of the weight.
5. **Selection has to be visible and relevant, or it behaves like a carousel.** Readable labels with a name, a situation and a city — never dots, never auto-rotation.

### 3.4 The legal standard that constrains all of this

The FTC's **Rule on the Use of Consumer Reviews and Testimonials, 16 CFR Part 465**, took effect **21 October 2024**. § 465.2(a) prohibits testimonials that materially misrepresent *"that the reviewer or testimonialist exists,"* *"that the reviewer or testimonialist used or otherwise had experience with the product, service, or business,"* and *"the reviewer's or testimonialist's experience with the product, service, or business."* § 465.2(b) extends this to disseminating testimonials about your own business that you *"knew or should have known materially misrepresented"* any of those things. The FTC states that the rule *"authorizes courts to impose civil penalties for knowing violations"*; no per-violation dollar figure appears on the FTC pages consulted, so none is asserted here.

Three consequences for this project, and they are not stylistic:

- Rendering a Tampa seller's video captioned with the city the visitor happens to be browsing misrepresents that seller's experience. It is running on 31 markets today.
- Publishing a video under a name that may not be the person in it goes to whether the testimonialist exists and had the experience described.
- A blanket sentence asserting written consent, printed under stories for which no consent record exists in the system, is a representation the company cannot currently evidence.

*This document is not legal advice. Findings 1, 2, 3, N1 and N2 describe consumer-protection exposure and should be reviewed by counsel before or alongside the fixes.*

---

## 4. Step 2 — Final audit

Twenty findings were raised in the previous audit. This section states what closed, what is still open, and what is new — each traced to a file and line, or to a URL read on 7 August 2026.

### 4.1 Closed since the last audit

| # | Finding | How it closed |
|---|---|---|
| G1 | Homepage stacked three testimonial sections | Only Spotlight is mounted now — `page.tsx:48`, `about/page.tsx:39`, `ServiceLocationClient.tsx:61`. Featured and Editorial survive in the codebase and in the admin preview only |
| 6 | Mobile auto-scroll fired on page load | The scroll now lives only inside `handleSelect` (`TestimonialsSpotlight.tsx:42–47`) and only below 1024px. It fires on a visitor's click, which is correct behaviour, not a defect |
| 12 | The same seller appeared three times on the homepage | Resolved by choosing one section |
| 20 (part) | Database policies were not in version control | Two migrations now exist — `20260731_add_testimonial_section_assignments.sql`, `20260805_add_testimonial_thumbnail_url.sql`. **Partial**: the `testimonials` and `testimonial_points` tables and the `testimonial-videos` bucket still have no migration, and the new files introduce a fresh problem — see N3 |
| 1 (staging only) | Seller locations rewritten to the visitor's city | `TestimonialCards` is no longer imported anywhere on `staging`. **Still live in production** — verified on 7 Aug 2026: `www.tarekbuyshouses.com/vacant-property/phoenix` renders "Rachel · Phoenix Metro," "Diane & Kim · Phoenix Metro," "Sara · Phoenix Metro." All three are Tampa-area sellers (`TestimonialCards.tsx:7–9`) |

Also worth recording as a genuine improvement: **proof now sits adjacent to the final conversion point.** Spotlight's Text and Call buttons are inside the story card (`TestimonialsSpotlight.tsx:171–186`), and on market pages the section sits immediately above the FAQ and the final CTA (`ServiceLocationClient.tsx:61–63`). That closes the gap the earlier proposal listed as G5 and satisfies requirement 3 in Section 3.3.

### 4.2 Still open

| # | Finding | Where | Severity |
|---|---|---|---|
| 2 | **Consent is asserted, not evidenced.** Every section prints "Every story shared with the seller's written consent" (`types/testimonial.ts:41–42`, rendered at `TestimonialsSpotlight.tsx:191`). There is no consent column in the schema or in `rowToTestimonial`, nothing gates publishing on it, and `SUBSTANTIATION.md` — which tracks BBB, Google, HGTV and the 1,000+ homes claim — still has no testimonials section | Schema, `SUBSTANTIATION.md` | **Critical** |
| 3 | **Star ratings are decorative.** `StarRow` hardcodes five filled stars and the label "5 out of 5 stars" (`SellerBadge.tsx:3–13`); Spotlight calls it with no argument (`:130`). The `rating` column is written by the admin (`useTestimonialMutations.ts:46, 81`) and never read by any public component | `SellerBadge.tsx`, `types/testimonial.ts` | **Critical** — a displayed rating is a representation |
| 4 | **Nothing is market- or situation-aware.** Spotlight takes no market or situation input; `useTestimonialSection("spotlight")` is global. `useTestimonialsByMarket` and `useTestimonialsByScenario` exist and have zero callers. Now materially worse than when it was raised: the section is mounted on the 544 landing pages, so one story set serves every situation × market combination | `useTestimonials.ts:126–154`, `ServiceLocationClient.tsx:61` | **High** |
| 5 | **An empty section still falls back to every published story** (`useTestimonials.ts:67–70`). Harmless at three stories; at forty a page with no assignment renders forty rail rows | `useTestimonials.ts` | **High** |
| 7 | **Editing a story still deletes its key takeaways.** The editor initialises points to an empty array and never loads the saved ones (`TestimonialEditModal.tsx:54`; no `useTestimonialPoints` import). Saving runs delete-then-insert (`useTestimonialMutations.ts:15–25`, called unconditionally at `:90`), so any edit to any field wipes that story's takeaways. The Module Guide documents a manual workaround; the defect is unchanged | `TestimonialEditModal.tsx`, `useTestimonialMutations.ts` | **High** — silent data loss |
| 8 | **Two featured stories still break the featured lookup** — `maybeSingle()` errors on a second row (`useTestimonials.ts:166`), with no warning to the person who starred it. The star toggle is still in the admin table | `useTestimonials.ts`, `TestimonialTable.tsx` | **Medium** — Featured is no longer public-facing, so blast radius is the admin preview |
| 9 | **Metadata is inconsistent between story types — now inside the recommended section itself.** The rail labels a video story with its full location and a written story with scenario plus whatever follows the comma (`TestimonialsSpotlight.tsx:105`). Live result: "Alice Blackwelder / Charlotte, NC" beside "Brian Aune / Relocation · CA" and "Don D / Loss in family · Orange County" — three different granularities in one column, and Brian's real city (Stevenson Ranch) is discarded in favour of a state | `TestimonialsSpotlight.tsx:105, 156` | **Medium** — direct miss against the SOP's consistency check |
| 10 | **The weakest copy on the page is still the copy that leads.** Alice's takeaways remain "Fair cash offer / Quick closing / No hassle" (`data/testimonials.ts:13`) and she still sorts first, verified live on both the staging homepage and the Tucson page. Don's lived timeline — "Contacted Friday night / Offer Saturday morning / Closed by Monday" — is one click away, where most visitors will not go. Against requirement 4 in Section 3.3, this is the highest-return unfixed item in the document | `data/testimonials.ts` and the database record | **Medium**, cheap to fix |
| 11 | **One video, three stories, seventeen situations.** Unchanged, and N1 below makes it worse | Content | **High** — the real critical path |
| 15 | **No loading state, with three consequences.** While the query is pending, `dbStories` is undefined and the section renders the built-in static trio (`TestimonialsSpotlight.tsx:37`). Verified: the crawlable HTML of both the staging homepage and `/vacant-property/tucson` serves the static Alice/Brian/Don set, not database content — so that is what Google indexes and what a first-paint screenshot captures. Worse, the static Alice record has no thumbnail and no poster (`data/testimonials.ts:3–14`), and `VideoStoryFrame` renders a plain black panel when a video is playable but has no thumbnail (`:202–208`) — which means **first paint is the black box Tarek raised**, before it swaps to the real cover | `TestimonialsSpotlight.tsx:37`, `data/testimonials.ts`, `VideoStoryFrame.tsx:202–208` | **High** |
| 16 | **The story rail has no cap**, and it is first in the DOM — the two-column grid only engages at `lg` (`TestimonialsSpotlight.tsx:78–80`). At fifteen stories a phone visitor scrolls fifteen selector rows before reaching any story content | `TestimonialsSpotlight.tsx` | **Medium**, becomes High as the library grows |
| 17 | **Selection is by array position** — `useState(0)` and `i === active` (`:38, :81`). Once the list varies per page, the highlighted story can shift silently. It should key on the story id | `TestimonialsSpotlight.tsx` | **Medium** |
| 18 | **Trust claims render unlinked.** "4.7 Google" and "A+ BBB" are plain spans (`:131–140`) though `SUBSTANTIATION.md` records both as linked elsewhere on the site. The separators are literal `·` spans, so the row can wrap awkwardly | `TestimonialsSpotlight.tsx` | **Low** |
| 19 | **No recency signal.** Nothing shows when a sale happened; the `Testimonial` type carries no date at all (`types/testimonial.ts:10–39`) | `types/testimonial.ts` | **Low** |
| 13 | **Captions on the three market-page videos are still unverified** — and under N1 they are about to be removed from the site rather than checked | Content | **High** |

### 4.3 New findings from this audit

| # | Finding | Detail |
|---|---|---|
| **N1** | **The market-page rollout removes three real seller videos instead of migrating them** | `TestimonialCards.tsx` is now referenced by nothing (`grep` finds only its own definition and export). Its three YouTube stories — Rachel `3VaQol2jWRw`, Diane & Kim `vjbp7kMFOT8`, Sara `eLBToOHBpO4` (`:6–10`) — are not in the testimonials database. Verified live: the production Phoenix page serves three videos plus three written quotes; the staging Tucson page serves one video plus two written stories. Shipping as-is cuts video social proof on 544 paid-traffic pages to close a compliance finding that `:117` closes on its own. Fix the attribution, migrate the footage, *then* retire the block |
| **N2** | **The identity behind the one database video is unconfirmed** | The story publishes as *Alice Blackwelder, Charlotte, NC* and points at `…/testimonial-videos/Angie-Malone.mp4` (`data/testimonials.ts:12`). One of the two is wrong. Under § 465.2(a) this goes to whether the testimonialist exists and had the experience described. **No further work on this section should be sent to Tarek until a human confirms who is in that video** — it is the default story every visitor sees first |
| **N3** | **The new storage policies allow anonymous writes** | `20260805_add_testimonial_thumbnail_url.sql` creates policies *named* "Authenticated users can upload / update / delete testimonial thumbnails" but grants each one `TO public`. Anyone can write over or delete objects in the `testimonial-thumbnails` bucket without signing in. Separately, "Admin full access on testimonial_section_assignments" is `TO authenticated USING (true) WITH CHECK (true)` — no admin check, so any authenticated account can re-curate what appears on the site. The `testimonial-videos` bucket and the `testimonials` / `testimonial_points` tables still have no migration, so those rules remain dashboard-only and can drift between production and testing undetected |
| **N4** | **Story loading is an N+1 query** | `enrichTestimonial` fetches each story's takeaways in its own request (`useTestimonials.ts:20–26`, `Promise.all` over rows). Three stories cost four round trips; forty cost forty-one. This is the scalability of the section the whole proposal rests on |
| **N5** | **Test coverage does not reach the module's failure paths** | Only `VideoStoryFrame.test.tsx`, `url-health.test.ts` and `storage-errors.test.ts` touch testimonials. There is no test for Spotlight, for section resolution, for the points save, or for the featured lookup — which is to say, no coverage on exactly the paths where findings 5, 7, 8 and 17 live. The suite passing is not evidence that this module is safe |
| **N6** | **Two video sections per page, still undecided** | Homepage: `VideoSection` "Watch Before You Call" at `page.tsx:27`, Spotlight at `:48`. Market pages: `VideoSection` at `ServiceLocationClient.tsx:54`, Spotlight at `:61`. The previous audit asked for this to be a deliberate decision. It has not been made, and it is now inherited on every page |
| **N7** | **A leftover `<hr />` sits under the homepage section** (`page.tsx:50`) — an artifact of the three-way test, still rendering live as a divider above "We Buy Homes in 30+ Markets" |
| **N8** | **The rail is not keyboard-navigable as a tab set.** The selectors are plain buttons with `aria-pressed` (`TestimonialsSpotlight.tsx:83–118`) — no tab roles, no arrow-key movement. Functional with a keyboard, but not the pattern assistive technology expects from a selector this central. A 10/10 item, not a blocker |
| **N9** | **Market-specific heading copy is lost.** Production market pages head their block "What Tucson Homeowners Say About TBH"; the new section renders the same generic H2 everywhere. Worth naming the tension rather than hiding it: the localised heading implies local sellers those pages do not have, so the generic heading is the *more* compliant choice. The right answer is real local footage, not localised copy over non-local stories |
| **N10** | **Our own Step 1 research did not survive verification.** Four of the figures we published are withdrawn in Section 3.2. Recorded as an audit finding because the SOP treats research as a deliverable, and this one shipped with errors in it |

---

## 5. Step 3 — Present the why

### 5.1 Why Spotlight, against the five requirements

| Requirement from Section 3.3 | How Spotlight meets it |
|---|---|
| One curated section, not a wall or a stack | One section per page, one story in view at a time, with the rail as context rather than as a second wall of quotes. Featured and Editorial are retired from public pages |
| Captions on every video | The frame is caption-agnostic — it plays whatever file is uploaded — so this is a content gate, not a design property. It is gate 1 in Section 8, and the design does not let us pretend otherwise |
| Proof at the conversion point | Text and Call sit inside the story card, under the takeaways (`:171–186`). Featured puts its buttons below the whole block; Editorial has one at the very bottom; the legacy block puts them between two sub-sections. Spotlight is the only layout that satisfies this |
| Depth costs attention | The section is a fixed height regardless of library size, so it never pushes the rest of the page down as stories are added — the failure mode Editorial has by construction. The corollary is finding 10: because attention concentrates on the first story shown, whichever story leads has to be the strongest one |
| Visible, relevant selection — not a carousel | No auto-rotation, no dots, no timers. Every option is a labelled row with a name, a story type and a place, and playback is always visitor-initiated (`VideoStoryFrame` defaults `autoPlay` to false and Spotlight never overrides it). This is precisely the exception the carousel literature carves out |

### 5.2 Why not the alternatives

- **Featured** is hard-capped at one video and two written stories by construction. Assign ten and it silently shows three. For a company running an active testimonial tracker that is a display case, not a section. **Retire.**
- **Editorial** scales without limit, but page height scales with it, and long-form stories on a mid-scroll landing page compete with the form. **Repurpose** for a future dedicated stories page, where depth is the point — the codebase already supports it.
- **The legacy `TestimonialCards` block** shows three 16:9 YouTube videos and three written quotes with no self-selection, no per-story detail, no takeaways, and — critically — the attribution defect. **Retire, but only after its footage is migrated.**
- **Stacking two or three of them**, which is what the homepage did during the test, is what made one seller appear three times. That reads as thin, not thorough.

### 5.3 Where the section goes, and where it does not

| Page type | Placement on staging | Assessment |
|---|---|---|
| **Homepage** | After "How It Works," before the markets grid (`page.tsx:48`) | **Correct.** The visitor has just learned the process; the next question is "does this work for someone like me." Remove the stray `<hr />` at `:50` |
| **About** | After "How It Works," before the protection guarantee (`about/page.tsx:39`) | **Correct**, and it replaces a block that was never connected to the admin panel |
| **Market pages (544)** | After the protection guarantee, immediately above the FAQ and final CTA (`ServiceLocationClient.tsx:61`) | **Correct position, wrong readiness.** Proof directly above the final CTA is the strongest available slot on that template. But it is the tenth of twelve sections, and with no per-page resolution all 544 pages show the same three non-local stories — the defect of the current block, in a better container. This is decision 2 in Section 11 |

### 5.4 What this proposal is not claiming

Under the SOP's "perfect, not functional" bar, the honest limits belong in the proposal rather than in a follow-up:

- **No conversion forecast.** There is no published test on selectable testimonial galleries, so no percentage is promised. The design follows the defensible principles; the result has to be measured.
- **The design does not fix the content.** One generic cash-sale video against seventeen situations is a footage problem, and every engineering item in this document leaves it untouched. The testimonial tracker is the critical path and should run in parallel, not after.
- **A better container does not create local proof.** Until there are stories from more markets, a Phoenix visitor sees a Charlotte seller. The correct handling is to show the seller's real city and let the story stand on the situation — never to relabel the seller.

---

## 6. Step 4 — Build status

**Public section.** `TestimonialsSpotlight` — seller rail, spotlight card, trust bar, Text/Call inside the card, automatic disclaimer line, an optional "next stories drop in here" slot, and a `left` / `center` heading variant used to match market-page alignment. Reads from `testimonial_section_assignments` via `useTestimonialSection("spotlight")`, falling back to three curated static stories.

**Shared video frame.** `VideoStoryFrame` supports uploaded files and YouTube, with a "Video unavailable — Retry" panel on a failed source, an initials panel on a failed thumbnail, a "Video coming soon" placeholder when neither exists, click-to-play, replay, and a mute toggle. Never auto-plays unless explicitly told to.

**Admin module** at `/admin/testimonials`: stat cards, search, status and scenario filters, sortable table, featured toggle, create/edit/delete; a video-or-written editor with validated uploads (video ≤100MB, thumbnail ≤5MB), plain-language storage errors, background URL-health warnings and inline previews; and a Sections tab with per-section assignment, ordering and a live preview.

**Data model.** `testimonials` (kind, status, media URLs, body, scenario, rating, `market_slug`, featured flag, sort order), `testimonial_points` (takeaways), `testimonial_section_assignments` (which story appears in which section, in what order).

**What the module does not yet have**, and what the rollout needs: consent fields; market/situation scope on assignments; an explicit default list; a "shows first" marker; a rating actually read by the site; a recency field surfaced anywhere; and tests on the paths in findings 5, 7, 8 and 17.

---

## 7. Step 5 — QA against the SOP quality checklist

Assessed against the build as it stands on `staging` @ `26da4a4`, before the gates in Section 8.

| Check | Status | Notes |
|---|---|---|
| **Captions / on-screen text** | **PARTIAL** | The database video carries on-screen text. The three market-page videos remain unverified (finding 13) — and on staging they are removed rather than checked (N1) |
| **Video cover / thumbnail** | **FAIL** | A real cover exists on the database record and the broken-media fallbacks are tested. But the static fallback has no thumbnail, so **first paint renders a black frame with an initial** before swapping (finding 15). The specific defect Tarek raised is still reachable on every page load |
| **Cross-page consistency** | **PASS on staging, FAIL in production** | One section, one format, three page types on `staging` — a real improvement. Production still runs the legacy block. Within the section, rail metadata still differs by story type (finding 9) |
| **Placement backed by research** | **PASS, with a correction** | Section 3, including four figures withdrawn as unsupported. The recommendation follows the evidence that survived |
| **Automation reliability** | **FAIL** | Findings 7 and 8 are silent-failure paths with a documented human workaround; the section falls back to everything published when unassigned (5); N3 leaves a storage bucket writable by anonymous users; N5 means none of these paths is covered by a test |
| **"Perfect" bar, not "functional" bar** | **FAIL** | It works and it looks right. It is not ready while the site asserts consent it cannot evidence, displays a five-star rating tied to nothing, relabels sellers' cities in production, and publishes a video whose subject is unconfirmed |

**Not ready for Step 6.** Three checks fail, one is partial, and one passes only on staging. The recommendation in Section 5 can be approved now; the build should not reach Tarek until gates 1–5 below are closed.

---

## 8. Gates before Tarek review

Blocking. Each is small, and none is a redesign.

| # | Gate | Owner | Why it blocks |
|---|---|---|---|
| **1** | **Ship the attribution fix to production** — `TestimonialCards.tsx:117`, with the correct line already sitting commented at `:116`. Then watch the three videos muted and caption or re-cut as needed | Developer / Video | Ends a live FTC exposure on 31 markets today, independent of any redesign. One line |
| **2** | **Confirm who is in the "Alice Blackwelder" video** and correct the name or unpublish the record | Developer + whoever holds the release | N2. This is the first story every visitor sees |
| **3** | **Resolve consent** — add a consent flag, date and document reference, gate publishing on it, and add a testimonials section to `SUBSTANTIATION.md`; or remove the blanket consent sentence from the disclaimer. Either is defensible; asserting it without a record is not | Developer + Operations | Finding 2. A decision, then a small build |
| **4** | **Stop the takeaway wipe** — load existing points into the editor and make the save non-destructive. Fix or hide the featured star while the lookup breaks on two rows | Developer | Finding 7 and 8. Anyone editing testimonials today is destroying content |
| **5** | **Close the first-paint black frame** — give the static fallback a real thumbnail and render a skeleton (or hydrate the query server-side) instead of the static trio | Developer | Finding 15. It is the exact defect that triggered this whole workstream, and it is what crawlers index |
| **6** | **Lock down access** — restrict the thumbnail storage policies to authenticated writers, add a real admin check to the assignments policy, and bring the `testimonials` / `testimonial_points` tables and the videos bucket into migrations | Developer | N3. Anonymous write access to a public bucket is not something to ship past |
| **7** | **Rewrite the leading story's takeaways as concrete facts** — or reorder so Don's timeline leads | Developer / Copy | Finding 10. Twenty minutes on the most-seen content on the page |

Non-blocking, same pass where practical: remove the stray `<hr />` (N7); link the Google and BBB claims (18); cap the rail with a "show more" (16); key selection on story id (17); put the story card before the rail on mobile (16); make rail metadata identical across story types and show real cities (9); wire the stored rating or drop the stars (3); add a recency line (19); collapse the takeaways N+1 into one query (N4); add tests for section resolution, the points save and the featured lookup (N5).

---

## 9. Rollout

| Phase | Action | Gate |
|---|---|---|
| **0** | Approve this proposal and the three decisions in Section 11 | Diane/Madz → Tarek |
| **1** | Attribution fix live in production, three videos watched muted and captioned or re-cut | Gate 1 |
| **2** | Gates 2–7 closed on `staging`; non-blocking polish in the same pass | Gates 2–7 |
| **3** | Spotlight to **homepage + About** in production. Two pages, no per-page resolution required | QA, then Tarek live review |
| **4** | **Migrate Rachel, Diane & Kim, Sara** into the module with true locations and captioned files. Retire `TestimonialCards` once its content lives in the database | — |
| **5** | **Per-page resolution**: optional market/situation scope on assignments; resolve exact match → situation → market → explicit default list, biased toward situation; make the default list explicit rather than "everything"; mark which story shows first | Findings 4, 5 |
| **6** | Spotlight to the **544 market pages**, with the rail cap, id-based selection, mobile ordering and loading state already in | QA, then Tarek live review |
| **Parallel** | **Testimonial tracker → new footage.** Nothing in phases 1–6 produces a second video. With one generic clip against seventeen situations, footage is the constraint on every option in this document | Operations / Video |

---

## 10. Step 6 — What Tarek should check live

1. **Homepage, mid-page** — one testimonial section, no duplicates, no stray divider.
2. **Load it cold on a phone** — the cover image is a real frame, not a black box, from the first moment the section appears. This is the check that mattered most.
3. **Play the video with the sound off** — the captions carry the story.
4. **Click a second seller in the rail** — the story swaps, nothing auto-plays, the page does not jump away from what he was reading.
5. **A market page** — Tucson, then Phoenix. Every seller's own city is shown, and it is the same city on both pages.
6. **The final CTA path** — Text and Call are inside the story card, directly above the FAQ and the closing CTA.
7. **Admin** — assign and reorder a story in the Sections tab, watch the live preview, save, then reopen the story and confirm its takeaways are still there.
8. **What to measure afterwards**, since the self-selection premise is unproven: rail click-through rate, video play rate, and Text/Call clicks originating inside the section, against the current block. That is the evidence this proposal owes.

---

## 11. Decisions requested

**Decision 1 — Consent.** Add a real consent record to the schema and gate publishing on it, or remove the blanket consent sentence from the public disclaimer. Recommendation: **add the record.** The sentence is worth keeping and it is only true if the data exists; either way `SUBSTANTIATION.md` needs a testimonials section.

**Decision 2 — Market pages.** Roll Spotlight onto the 544 pages with one curated default set now, or hold until per-page resolution ships. Recommendation: **hold**, and fix production's attribution in place in the meantime. The interim state keeps three videos live and legally correct; rolling out early trades three videos for one and locks in the "same three stories everywhere" defect we already named.

**Decision 3 — Two video sections per page.** "Watch Before You Call" near the top and Seller Stories mid-page currently coexist on every template. They serve different jobs — company explainer versus seller proof — which is a reasonable case for keeping both. It should be an explicit decision, and if both stay, the explainer should not look like a testimonial.

---

## 12. Sources

Each source is graded. Marketing-vendor benchmarks are labelled as such; withdrawn figures are listed in Section 3.2 and are not cited here as support.

| Source | Used for | Grade |
|---|---|---|
| Digital Applied — *Landing Page Conversion: 2,000 Pages Tested in 2026* · digitalapplied.com/blog/landing-page-conversion-study-2000-pages-tested-2026 | Single testimonial card vs. a wall (+14%) | Vendor benchmark, method stated, dataset unaudited |
| Verizon Media + Publicis Media captions study, via 3Play Media · 3playmedia.com/blog/verizon-media-and-publicis-media-find-viewers-want-captions | 80% more likely to finish a captioned video; 50% watch with sound off | Primary survey, n=5,616, April 2019 |
| Smashing Magazine — *Usability Guidelines For Better Carousels UX* · smashingmagazine.com/2022/04/designing-better-carousel-ux | The carousel exception for testimonial browsing | UX synthesis of NN/g, Baymard, UXMatters — dated 2022 |
| Nielsen Norman Group — *Scrolling and Attention* · nngroup.com/articles/scrolling-and-attention | Attention concentrates in the first two screenfuls | Primary eyetracking research |
| Foundry CRO — *Landing Page Video Benchmarks 2026* · foundrycro.com/blog/landing-page-video-benchmarks-2026, and Zebracat's underlying post | Proof at the conversion point, directional only | Vendor self-attributed, no method — directional |
| U.S. Federal Trade Commission — *Consumer Reviews and Testimonials Rule: Questions and Answers* · ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers, with 16 CFR Part 465 · ecfr.gov | Effective date, prohibited misrepresentations, civil penalties | Primary — regulator |
| TBH internal — *Research-First Process SOP*; *Testimonials Placement Audit*; *Testimonials Module Guide*; `SUBSTANTIATION.md` | Standard, prior findings, module behaviour, claim substantiation | Internal |

---

## Appendix — verification log

**Repository state.** `staging` @ `26da4a4` ("feat: change testimonials quote to italic"), read 7 August 2026.

**Files read in full:** `src/components/testimonials/TestimonialsSpotlight.tsx`, `VideoStoryFrame.tsx`, `TestimonialCards.tsx`, `SellerBadge.tsx`; `src/types/testimonial.ts`; `src/data/testimonials.ts`; `src/hooks/testimonials/useTestimonials.ts`; `src/app/page.tsx`; `src/app/about/page.tsx`; `src/app/[situation]/[market]/ServiceLocationClient.tsx`; `supabase/migrations/20260731_add_testimonial_section_assignments.sql`; `supabase/migrations/20260805_add_testimonial_thumbnail_url.sql`; `SUBSTANTIATION.md`.
**Files read in part:** `TestimonialEditModal.tsx`, `useTestimonialMutations.ts`, `TestimonialSectionsManager.tsx`, `TestimonialSectionPreview.tsx`, `TestimonialTable.tsx`.
**Searches run:** every import of the four section components; every caller of the six testimonial hooks; the migrations directory; the test directory.

**Pages read live, 7 August 2026:** `tarekbuyshouses-testing.vercel.app/` · `tarekbuyshouses-testing.vercel.app/vacant-property/tucson` · `www.tarekbuyshouses.com/vacant-property/phoenix` · `www.tarekbuyshouses.com/vacant-property/tucson`.

**Research verification:** every figure in the prior Step 1 was fetched from its attributed page and, where that page cited a source, from the underlying source. Results in Sections 3.1 and 3.2.

**No code was changed in the course of this audit.**
