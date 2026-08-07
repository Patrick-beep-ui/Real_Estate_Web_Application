# Seller Stories

**A proposal to replace every testimonial block on the site with one section**

*Submitted under the TBH Research-First Process SOP — Step 3, Present the Why*

| Field | Detail |
|---|---|
| **Proposed by** | Patrick Solis — Development |
| **Applies to** | Homepage, About page, and the 544 situation × market landing pages |
| **The proposal** | Adopt the **Spotlight** layout — presented on the site as **Seller Stories** — as the single testimonial section, operated through the Testimonials admin module |
| **Replaces** | The two stacked testimonial blocks in production, and the three-layout comparison currently on the staging homepage. The other two candidates, **Featured** and **Editorial**, are addressed in Section 3 |
| **Decision needed from** | Diane Cruz / Madz Amparo, then Tarek El Moussa |
| **Supporting audit** | *TBH Seller Stories — Audit Annex* (same folder): the full code and compliance audit, the findings register, and the verification log behind every claim made here |
| **Status** | Design ready for approval. Three decisions are requested before the build goes live — Section 6 |

---

## 1. What I am proposing

**One testimonial section, on every page, run by the team instead of by a developer.**

The section is called **Seller Stories** — the layout referred to as **Spotlight** in the earlier audit, in the codebase, and in the admin panel's Sections tab. A visitor sees a short list of sellers — each labelled with a name, a situation, and a place — and picks the one closest to their own circumstances. Their choice opens as a full story beside the list: the video if there is one, the seller's own words, the specific facts of what happened, and a Text and Call button directly underneath. A trust bar sits below the list. Nothing rotates, nothing plays until the visitor asks it to.

Behind it, the Testimonials module already lets the team add a story — written or on video, with its own cover image — decide which stories appear, and in what order, without touching code or waiting for a deploy.

**What changes:** the two blocks in production and the three-layout test on staging collapse into this one section, on the homepage, the About page, and all 544 landing pages. The long-form layout is kept in reserve for a future dedicated stories page. The other two are retired.

---

## 2. What is on the site today

**Two systems, neither of them fully right.** The homepage runs on the database and reflects the admin panel. The About page and every market page run on an older hardcoded block that the admin panel cannot reach — so a story the team adds does not appear on the pages that receive the most traffic.

**The same three stories on every page.** There is no way to show a divorce seller to a divorce visitor, or a Tampa seller to a Tampa visitor, because the block has no notion of which page it is on.

**A seller's city is rewritten to the visitor's city.** The hardcoded block labels each video with whatever market the visitor happens to be browsing. Rachel sold in Ybor City, Tampa; on the Phoenix page she is labelled "Rachel · Phoenix Metro." This is running on 31 of 32 markets today. The FTC's Consumer Reviews and Testimonials Rule, in force since October 2024, prohibits testimonials that misrepresent a reviewer's actual experience — and in a "we buy houses in your city" pitch, the city is the whole point of the label. **This is the most urgent item in the document and it is a one-line fix**, independent of everything else proposed here.

**Three of the four blocks cannot grow.** The library is three stories today. The tracker will keep producing more, and the tracker is the real constraint: one generic cash-sale video against seventeen situations.

---

## 3. Why this design

Six requirements. Five come from the research; the sixth comes from how this company actually operates. **Seller Stories — Spotlight — is the only one of the four candidate layouts that meets all six.**

| Requirement | Why | How Seller Stories meets it |
|---|---|---|
| **One curated block, not a wall and not a stack** | A single testimonial card with a face, a name and a place outperforms a wall of quotes — readers process one anchor better than six | One section, one story in view, with the list as context rather than a second wall of quotes |
| **Captions on every video** | Half of viewers watch with the sound off; 80% say they are more likely to finish a video that is captioned | The frame plays whatever is uploaded, so this is a content rule, not a design property — and it is written into the decisions in Section 6 rather than assumed |
| **Proof at the point of decision** | A testimonial next to the button outperforms the same testimonial placed elsewhere on the page | Text and Call sit inside the story card, under the seller's facts. The other three layouts put their buttons below the whole block, or at the very bottom of the page |
| **The first story shown carries the weight** | Attention concentrates at the top: roughly 57% of viewing time is spent above the fold and 74% within the first two screenfuls | The section is one fixed-height block, so it never pushes the page down as stories are added — and the admin panel controls which story leads |
| **Selection must be visible, relevant, and visitor-initiated** | Rotating content fails — people rarely advance past the first slide. The documented exception is when someone is actively exploring options that are relevant to their task, and browsing testimonials is the named example | No rotation, no timers, no dots. Every option is a readable row with a name, a situation and a place. The visitor's choice is visible, and playback only ever starts on a click |
| **It has to absorb new stories, and non-developers have to run it** | The tracker keeps producing stories. A section that needs a developer, or a redesign, every time one arrives will fall out of date | The list simply gets longer; the layout does not change. Adding a story, ordering it, and choosing where it appears are all admin-panel actions with a live preview |

**Why not the alternatives.** The compact *Featured* layout is capped at one video and two written stories by construction — assign ten and it silently shows three; that is a display case, not a section. The long-form *Editorial* layout grows without limit, but so does the page, and full stories mid-scroll compete with the form; it belongs on a dedicated stories page, which is where it is being kept. The **legacy block** offers no self-selection, no per-story detail, is 16:9 in a phone-first world, and carries the attribution defect. And **stacking** two or three of them — which is what the staging homepage does for comparison — is why one seller currently appears three times on that page. That reads as thin, not thorough.

*Each figure above was read at its original source rather than taken from a summary. Sources: Digital Applied's 2,000-page landing-page study (Oct 2025 – Mar 2026); the Verizon Media / Publicis Media captions survey of 5,616 U.S. adults; Nielsen Norman Group eyetracking; Smashing Magazine's carousel guidelines, synthesising Nielsen Norman Group and Baymard; and the FTC's Consumer Reviews and Testimonials Rule, 16 CFR Part 465, in force since October 2024. Four figures carried in earlier drafts were withdrawn after re-checking them at source — the case above rests only on what survived. The full grading, and the one gap where no published test exists, are in the audit annex.*

---

## 4. What was verified, and what was not

**Verified**

- **The section can be operated by the team, end to end.** A story can be added in the admin panel, assigned to Seller Stories, ordered, and confirmed live on the page — and removed from the section again without deleting the story itself. This is the behaviour the whole proposal depends on, and it works.
- **It is responsive.** The section renders and behaves correctly on mobile: the seller list, the story card, the video frame, and the Text and Call buttons all stack cleanly, and selecting a story keeps the visitor in place.
- **The code behind all four layouts**, the shared video player, the data hooks, and the admin module — read in full, not sampled.
- **Live rendering** of the staging homepage, a staging market page, and the equivalent pages in production, including what a search crawler receives.
- **The research**, at its original source in every case, and the FTC rule from the regulator's own text.

**Not verified — stated plainly rather than assumed**

- **Who is actually in the one database video.** The tracker lists the seller as *Alice Blackwelder*; the video file is named *Angie Malone*, which is how it came to be stored as `Angie-Malone.mp4`. One of the two names belongs to the person on screen, and it is the first story every visitor sees. This is decision two below.
- **Whether the three market-page videos carry burned-in captions.** Someone has to watch all three muted. This audit could not establish it, and neither could the previous one.

---

## 5. Where it goes

| Page | Placement | Why |
|---|---|---|
| **Homepage** | Mid-page, after "How It Works" | The visitor has just learned the process. The next question is "will this work for someone like me," which is exactly what the section answers |
| **About page** | After "How It Works," before the protection guarantee | Replaces a block the admin panel could never reach |
| **544 market pages** | Immediately above the FAQ and the closing CTA | The strongest available slot on that template: proof directly before the final ask. These pages receive the paid traffic and there are 544 of them against one homepage |

**Market pages matter most and should ship last.** Rolling out before stories can resolve per page would put the same three non-local stories on all 544 — the exact defect of the block being replaced, in a better-looking container. The work to fix that is small and already scoped: allow a story to be scoped to a situation and a market, then resolve exact match, then situation, then market, then a curated default list. It should land before the rollout, not after it.

---

## 6. Decisions requested

Three decisions. None of them is a redesign, and none of them can be made by the developer alone.

**One — the three seller videos: migrated, or let go.** As currently built on staging, the new section replaces the legacy block on market pages, and the legacy block is the only place three of our four seller videos live — Rachel, Diane & Kim, and Sara. They are not in the testimonials database. Shipping as-is would take 544 paid-traffic pages from three video testimonials down to one, in order to close a compliance problem that a single line closes on its own.

**Two — which name belongs to the seller in the video we are already publishing.** The tracker records the client as *Alice Blackwelder*. The video file we were given is named after *Angie Malone*, which is why it is stored as `Angie-Malone.mp4` and why the two names now disagree in the system. It is almost certainly a records mix-up rather than the wrong footage — but it is the first story every visitor sees, and under the FTC rule the name attached to a testimonial is a representation about who is testifying. Someone who was on the deal needs to confirm which name is the seller's so the record can be corrected before this ships.

**Three — do all 544 market pages show the same stories, or stories matched to the page?**

The section is one component used on every market page, and today it has no idea which page it is on. So there are two ways to run it:

- **The same set everywhere.** Every market page shows the same three stories. Simple, nothing more to build, and it is what the site does today — but a Phoenix foreclosure visitor sees a Charlotte cash-sale seller, and so does everyone else on all 544 pages.
- **Matched to the page.** A story can be tagged with a situation and a city, and each page shows the closest match — situation first, then city, falling back to a curated default set when there is nothing closer. With three stories against 544 pages the default will carry most of the traffic at first, and the matching only starts paying off as the library grows.

---

## 7. Rollout

| Phase | Action |
|---|---|
| **0** | Approve this proposal and the three decisions above |
| **1** | Attribution fix live in production. All three market videos watched muted, then captioned or re-cut |
| **2** | Decisions one and two actioned, plus the leading story's copy and the takeaway bug |
| **3** | Seller Stories live on the homepage and the About page. Two pages, nothing else required |
| **4** | The three videos migrated into the module with their real locations. Legacy block retired |
| **5** | Story matching built — situation and city scope, with a curated default set (decision three) |
| **6** | Seller Stories live on all 544 market pages |
| **Running alongside** | **New footage.** Nothing above produces a second video. One generic clip against seventeen situations is the constraint on every option in this document, and the tracker is the critical path |
