# "How It Works" Content Inventory — Pre-Redesign Reference

> Last updated: 2026-07-03
> Purpose: single source of truth for every piece of existing content that touches the "How It Works" story, before designing one unified section to use across all pages.
> Status: research/inventory complete. Redesign not started.

---

## Contents

1. [Current "How It Works" Content (3 Versions)](#1-current-how-it-works-content-3-versions)
2. [The Offer Calculation](#2-the-offer-calculation-how-the-money-works)
3. [Comparison Data (vs Agents vs Other Investors)](#3-comparison-data-vs-agents-vs-other-investors)
4. [Protection & Trust Guarantees](#4-protection--trust-guarantees)
5. [Actual End-to-End Lead Flow](#5-the-actual-end-to-end-lead-flow)
6. [Per-Situation Nuances](#6-per-situation-nuances-that-can-tailor-the-process)
7. [Social Proof Stats](#7-social-proof-stats-from-all-markets)
8. [Key Differentiators](#8-key-differentiators-from-faqcontent-across-all-situations)
9. [Available Database Content](#9-available-database-content-that-could-feed-into-process-steps)
10. [Gaps & Open Questions for the Redesign](#10-gaps--open-questions-for-the-redesign)

---

## 1. Current "How It Works" Content (3 Versions)

Three different versions of the same three-step story exist today, each with different wording and no shared source.

### Version A — Homepage inline
**File:** `page.tsx:449-465`

| Step | Title | Copy |
|---|---|---|
| 1 | Tell Us About Your Property | "Enter your address and basic info. Takes 60 seconds." |
| 2 | Get Your Cash Offer | "We'll call you within 24 hours with a fair, no-obligation cash offer." |
| 3 | Close on Your Timeline | "Pick your closing date — as fast as 7 days. We handle everything." |

Subtitle: *"Three simple steps to sell your home — no agents, no repairs, no waiting."*

### Version B — `HowItWorks` component
**File:** `components/HowItWorks.tsx`
**Used on:** situation/market pages + About page

| Step | Title | Copy |
|---|---|---|
| 1 | Tell Us About Your House | "Text or call us with your address. We'll research the property and get back to you within 24 hours with a cash offer." |
| 2 | Get Your Cash Offer | "No inspections, no appraisals, no waiting. We make a fair offer based on the [market] market and your home's condition." |
| 3 | Close On Your Timeline | "Pick your closing date — 7 days, 14 days, 30 days. We pay all closing costs. You walk away with cash." |

### Version C — Thank-you page
**Location:** `landing/thank-you`
**Framing:** "What happens next"

1. "We'll review your property details and prepare a fair cash offer"
2. "Our team calls you to discuss your offer — no obligation"
3. "Accept and close on YOUR timeline — as fast as 7 days"

### Cross-version inconsistencies worth flagging
- Response time is "within 24 hours" in A and B, but Version C doesn't commit to a timeframe for the call.
- Closing timeline is "as fast as 7 days" (A, C) vs. an explicit menu of "7, 14, or 30 days" (B).
- Step 1 varies between "enter your info" (A, implies form), "text or call" (B), and is skipped entirely in C (which starts after submission).
- Only B mentions who pays closing costs ("We pay all closing costs").
- Only B ties the offer explicitly to "the [market] market" — a personalization hook the others don't use.

---

## 2. The Offer Calculation (How the Money Works)

**File:** `OfferTransparency.tsx` — 4 explicit steps, each with a worked example.

| Step | Label | Description | Example |
|---|---|---|---|
| 1 | After Repair Value (ARV) | "We research comparable sales in your area to determine what your home would sell for in perfect condition." | $320,000 |
| 2 | Minus Repair Costs | "We estimate what it would cost to bring the property to market-ready condition." | −$45,000 |
| 3 | Minus Our Margin | "A small margin to keep our business running. Covers holding costs, transaction fees, and our profit." | −$35,000 |
| 4 | Your Cash Offer | "The amount you walk away with at closing. No hidden fees, no commissions, no surprises." | $240,000 |

Supporting line from the per-situation FAQs: *"We're transparent about our numbers — you'll see exactly how we calculated your offer."*

This is a distinct, more detailed process from the 3-step "How It Works" — it explains the *math* behind Step 2 ("Get Your Cash Offer"), not the overall journey.

---

## 3. Comparison Data (vs Agents vs Other Investors)

**File:** `ComparisonTable.tsx`

| Metric | Tarek Buys Houses | Traditional Agent | Other Investors |
|---|---|---|---|
| Timeline | 7–14 days | 60–180 days (varies by market) | 14–30 days |
| Fees/Commissions | $0 | 5–6% ($15K–$36K, varies by market) | Varies (hidden fees) |
| Repairs Required | None — as-is | Usually required | Sometimes |
| Showings | None | Dozens of strangers | 1–2 visits |
| Who You Deal With | Tarek's personal team | Random agent | Unknown LLC |

Market-specific agent timeline variations:
- Phoenix / Denver / Dallas: 60–120 days
- Atlanta / Charlotte / Orlando: 75–150 days
- Tampa / LA / San Diego / SF: 90–180 days

---

## 4. Protection & Trust Guarantees

**File:** `ProtectionGuarantee.tsx`

1. **Licensed & Insured** — "Fully licensed, bonded, and insured in every state we operate in."
2. **Third-Party Title Company** — "All closings handled by a reputable, state-licensed title & escrow company — never in-house."
3. **No-Obligation Offer** — "Our cash offer is 100% free with zero obligation. You're never pressured to accept."
4. **Complete Confidentiality** — "No yard signs, no MLS listing, no public record of a distressed sale. Your privacy is protected."

Plus: **Tarek El Moussa | CA DRE Lic# 01329011**

---

## 5. The Actual End-to-End Lead Flow

**Files:** `src/lib/leads.ts`, `src/app/api/leads/submit/route.ts`

```
USER SUBMITS FORM (takes ~60 seconds)
  → Address → Name/Phone/Email → Property Details
  ↓
24-HOUR RESPONSE WINDOW
  → System saves lead to database
  → GHL contact created (CRM)
  → Slack notification to team
  → GA4 + Meta Pixel conversion tracked
  ↓
TEAM FOLLOW-UP
  → Team calls within 24 hours
  → Discuss offer over phone
  ↓
OFFER & CLOSING
  → Fair cash offer presented (transparent breakdown)
  → No obligation to accept
  → If accepted: title company handles closing
  → Pick your close date: 7, 14, or 30 days
  → All closing costs paid by Tarek
  → You walk away with cash
```

This is the ground-truth process — everything in Versions A/B/C is a marketing simplification of this flow. Any redesigned "How It Works" section should stay consistent with this, especially the 24-hour response window and the 7/14/30-day close options.

---

## 6. Per-Situation Nuances That Can Tailor the Process

Every situation page has specific pain points and a core promise. These could justify per-situation variations of an otherwise-shared process (e.g., a swapped-in line under Step 1 or Step 3).

| Situation | Key Pain Points | Core Promise |
|---|---|---|
| Divorce | Shared asset, attorneys, privacy | Confidential sale, clean split, both parties move on |
| Foreclosure | Auction deadline, credit damage, bank pressure | Close before auction, save credit, keep equity |
| Inherited | Probate, multi-heir, out-of-state | Handle probate, coordinate heirs, buy as-is with contents |
| Behind on Payments | Missed payments, default notices, credit dropping | Pay off mortgage at closing, prevent foreclosure |
| Major Repairs | Foundation/roof/mold, $50K+ fixes | Buy in ANY condition, no inspections, as-is |
| Relocating | Double mortgage, new job start date | Close on your timeline (7–30 days), remote sale |
| Downsizing | Too much space, carrying costs, staging | No staging, coordinate with new home purchase |
| Vacant Property | Cash bleed (taxes/insurance), vandalism, code fines | Stop carrying costs, handle code violations |
| Tax Liens | Compounding penalties, county auction | Pay liens at closing, keep remaining equity |
| Bad Tenants | Non-payment, eviction costs, property damage | Buy with tenants in place, no eviction needed |
| Code Violations | Daily fines, unpermitted work, lender won't finance | Buy with violations open, deal with city after |
| Fire Damage | Uninhabitable, insurance delays, rebuild costs | Buy total/partial loss, insurance claim coordination |
| Hoarder House | Cleanout $10K–$30K, shame, no buyer will enter | Buy with everything inside, no photos, no judgment |
| Bankruptcy | Court approval, lender/trustee coordination | Court-compliant process, fast case resolution |
| Job Loss | Savings running out, credit at risk | Sell before missed payments, cash equity as bridge |
| Medical Bills | Health crisis, debt collectors, recovery | No showings during recovery, sell from hospital |
| Tired Landlord | Deferred maintenance, tenants, negative cash flow | Buy multi-unit, with tenants, exit strategy |

---

## 7. Social Proof Stats (from all markets)

- **1,000+** homes closed
- **4.7** Google rating
- **A+** BBB rating
- **100+** reviews
- **15+ years** of experience
- **17 situations** served
- **30 markets** across 13 states
- **Featured on:** HGTV, CNN, Forbes, Fox Business, People, USA Today
- **Tarek's personal story:** "I've been through a divorce. I know what it's like."

---

## 8. Key Differentiators (from FAQ/content across all situations)

Repeated across every situation page — the recurring selling points that could be woven directly into process steps rather than left as a separate FAQ list:

1. **"We buy as-is"** — no repairs, no cleaning, no inspections. Every situation says this.
2. **"No fees or commissions"** — zero agent commissions, zero closing costs paid by seller.
3. **"Close in 7–14 days"** — versus 60–180 days with an agent.
4. **"Fair, transparent offer"** — walked through every number.
5. **"No obligation"** — the offer is free, take it or leave it.
6. **"Tarek's personal team"** — not a faceless LLC; a known TV personality's team.
7. **"Confidential"** — no signs, no MLS, no open houses.
8. **"Third-party title company"** — all closings handled by a licensed, state-regulated escrow company.
9. **"We pay off liens/mortgages at closing"** — tax liens, mortgages, code fines all settled at closing.
10. **"Leaseback available"** — sell but stay in the home for an agreed period (mentioned in medical-bills FAQ).

---

## 9. Available Database Content That Could Feed Into Process Steps

The `generated_content` table (737 rows, AI-published via Gemini 2.5 Flash) holds per-situation × per-market content:

- `headline`, `subheadline`, `body_paragraphs[]`, `bullets[]`
- `faqs[]` (5–6 Q&A — many already answer process questions like "how fast can you close?", "do I need to clean?")
- `before_title`/`body`, `after_title`/`body`, `warning_title`/`body` (case studies)
- `urgency_line` (reasons to act now)
- `why_tarek_body[]` (social proof)
- `final_cta_headline`/`subline`
- `sms_prefilled_text` (pre-written SMS starter texts)

**Gap:** there are currently zero fields in either the static config or the AI-generated content table dedicated to process steps or "how it works" descriptions. Any per-situation personalization of the process would need new fields added to this table (or a separate static mapping), since nothing today generates that content per situation × market.

---

## 10. Gaps & Open Questions for the Redesign

Carried over from the research, plus a few worth deciding on before the redesign starts:

- **No canonical version.** Three different pieces of copy (A/B/C) describe the same process with different wording, different response-time framing, and different closing-timeline framing. A unified section needs one to win, or a documented reason for keeping page-specific variants.
- **The 3-step story and the 4-step offer math are separate today.** Step 2 of "How It Works" ("Get Your Cash Offer") and the entire `OfferTransparency` breakdown both describe the same moment in the process at different levels of detail. Worth deciding whether the redesigned section links to/embeds the offer math, or keeps them fully separate.
- **No process-step field exists per situation.** Section 6 shows there's rich material to personalize a process step per situation (e.g., "we coordinate probate" for Inherited, "we close before auction" for Foreclosure), but nothing in the CMS/database currently stores this — it would need new content, not just a redesign of existing content.
- **Trust guarantees, comparison table, and differentiators currently live as separate sections/components**, not integrated into "How It Works" — worth deciding whether the redesign folds any of them in (e.g., "no obligation," "third-party title company") or keeps them adjacent.
- **Lead-flow ground truth vs. marketing copy:** the real system (Section 5) commits to specific mechanics (24-hour call window, 7/14/30-day close options, GHL/Slack/analytics on the backend) that should constrain whatever the redesigned copy promises, so the section doesn't overstate or understate the actual process.

