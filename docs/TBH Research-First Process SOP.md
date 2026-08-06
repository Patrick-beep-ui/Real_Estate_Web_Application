# Research-First Process for TBH

**Standard Operating Procedure**

*Tarek Buys Houses — Internal SOP*

| Field | Detail |
|---|---|
| **Document** | SOP — Research-First Process for Website, Automation & Video Changes |
| **Owner** | Diane Cruz — Operations |
| **Applies to** | Any change built by the team before it goes live — website design/layout/content, video production and editing, and automations/workflows (Claude, Manus, n8n, the internal command center, callers, agents, etc.) |
| **Source** | Tarek x Madz x Diane discussion, August 5 |
| **Final approver** | Tarek El Moussa |
| **Status** | Active |

## 1. Why This SOP Is Needed

Without a documented process, changes — whether to the website, an automation, or a video asset — are made based on individual judgment, get built inconsistently from person to person, and quality issues are caught only after they've already reached the live site, a running workflow, or the customer. This SOP exists to close that gap, across every discipline that ships work to production. It ensures:

- **Consistency** — every change follows the same process regardless of who is making it, so quality doesn't depend on who happened to be assigned the task.
- **Evidence over guesswork** — decisions about placement, design, automation logic, and video content are based on current research and data, not assumption, habit, or convenience.
- **Fewer errors reaching production** — problems are caught during research and QA, before the change is built and before it reaches Tarek or the public site, rather than after.
- **Clear accountability** — each step has a defined owner, so it's always clear who was responsible for research, for QA, and for final approval.
- **A process that scales** — as the team, the tooling (Claude, Grok, Manus, the internal command center), and the number of markets grow, the same standard applies without needing to be re-explained each time.

## 2. Core Rule

Before anyone ships a change — a website update, a new automation or workflow, or a video edit — they must research and audit first, then present their reasoning. This applies equally to all TBH team members. Implementation without that groundwork is not acceptable, regardless of how polished the end result looks.

> "Before something gets to me, I expect [the owner of the change] to take his phone, put the website into Claude and ask what is the absolute best placement for this video and why based on factual case studies in 2026. And then I would expect him to have Claude audit the site to say what is missing."
>
> — Tarek El Moussa

## 3. The Process

Every change — website, automation, or video — follows the same six steps — no step is skipped, regardless of discipline or how small the change seems:

| Step | Who | What Happens |
|---|---|---|
| **1. Research First** | Owner of the change — developer, automation architect, or video editor/director | Before touching anything live, research current (2026) best practices and real case studies for the specific thing being changed. A developer asks where a testimonial should live for the highest conversion; an automation architect asks how similar teams structure a given workflow or agent handoff; a video editor/director asks what pacing, captioning, or structure performs best for this type of content today. Use Claude and/or Grok for this, regardless of discipline. |
| **2. AI Audit** | Owner of the change | Feed the current site, workflow, or cut to Claude and ask it to audit for what's missing — for a page: editing, captions, thumbnails, inconsistent placement; for an automation: failure points, missing error handling, redundant steps; for a video: pacing, captions, missing B-roll, weak hook. This audit becomes the basis for the build, not a guess. |
| **3. Present the Why** | Owner of the change | Before building, present the recommendation and the research/audit behind it to Diane/Madz (and Tarek for larger changes). No implementation starts without an explanation of why this approach was chosen — this applies equally to a page layout, an automation design, or an edit. |
| **4. Build** | Whoever owns execution — developer, automation architect, or video editor/director | Implement the change based on the approved research and audit findings, in whichever system it lives — the website, an automation platform, or an editing timeline. |
| **5. QA Against the Standard** | Diane or Madz | Check the finished work against the quality bar in Section 4 before it goes to Tarek — not after. The specific checks differ by discipline, but the requirement to check before escalating does not. |
| **6. Tarek Review** | Tarek El Moussa | Final review and sign-off. Tarek checks it live — on the actual page, running the actual automation, or watching the actual cut — not just a description of the work. |

## 4. Quality Checklist (Applies Before Anything Reaches Tarek)

Diane or Madz should confirm all of the following before a change is sent to Tarek for review:

| Check | Standard |
|---|---|
| **Captions / on-screen text** | Every video must have burned-in captions or on-screen text. ~80% of viewers watch muted — a video without text will not get watched, regardless of content quality. |
| **Video cover / thumbnail** | No video should ever display as a plain black box before playing. A real cover image or first-frame thumbnail is required. |
| **Cross-page consistency** | Testimonials (or any repeated content block) must appear in the same format and location across all pages — homepage, local/city pages, and individual property pages. If a page has video testimonials, all comparable pages should follow the same pattern. |
| **Placement backed by research** | The location of any testimonial, CTA, or trust element on the page — or the structure of an automation/workflow — should be justified by current best-practice research, not placed or built by default or convention. |
| **Automation reliability** | Any new automation or agent has clear fallback/error handling for failed steps, has been tested end-to-end (not just for the happy path), and doesn't silently break other workflows it touches (e.g., duplicate routing, conflicting triggers). |
| **"Perfect" bar, not "functional" bar** | Work is not ready for Tarek's review just because it technically works. Whether it's a site page, an automation, or a video, it should reflect a polished, professional standard — Tarek's stated bar is a 10/10, not a passing grade. |

## 5. Roles & Responsibilities

- **Tarek El Moussa** — sets the quality bar, gives final sign-off, reviews the live result regardless of discipline.
- **Diane Cruz / Madz Amparo** — QA the work against the checklist above before it's sent to Tarek; escalate if research/audit steps were skipped.
- **Developers** — responsible for completing Steps 1–4 (research, audit, present reasoning, build) for any website or platform change before requesting review.
- **Automation Architect** — responsible for completing Steps 1–4 for any new or modified automation, agent, or workflow (e.g., the caller, Slack agents, GHL/CRM automations) before it's turned on or deployed.
- **Video Editor/Director** — responsible for completing Steps 1–4 for any video asset — testimonials, ads, social content — before it's handed off for placement on the site or in a campaign.

## 6. What Good Looks Like

- A specific, sourced answer to "why this way" before any change is built — not a choice made by convention, whether it's a page layout, an automation's logic, or an edit decision.
- A Claude-run audit attached to the request for review — of the relevant page(s), the workflow, or the cut — showing what was checked and what was found.
- Consistent treatment of repeated elements (testimonials, automation error-handling patterns, video branding/captions) across every instance, not just the first one built.
- Nothing described as "done" that still needs obvious fixes (missing captions, placeholder thumbnails, broken embeds, an automation with no fallback for a failed step) — those are caught in Step 5, before Tarek ever sees it.

---

*This SOP applies across disciplines — web development, automation/workflow architecture, and video production — and should be reviewed as the team's AI tooling (Claude, Grok, Manus, the internal command center) evolves. The steps and the quality bar stay the same even as the tools used to execute them change.*
