// Situation-specific content for dynamic landing pages
// Each situation has unique messaging, FAQs, hero copy, and emotional hooks

import heroForeclosure from "@/assets/hero-foreclosure.jpg";
import heroInherited from "@/assets/hero-inherited.jpg";
import heroBehindPayments from "@/assets/hero-behind-payments.jpg";
import heroMajorRepairs from "@/assets/hero-major-repairs.jpg";
import heroRelocating from "@/assets/hero-relocating.jpg";
import heroDownsizing from "@/assets/hero-downsizing.jpg";
import heroVacant from "@/assets/hero-vacant.jpg";
import heroTaxLiens from "@/assets/hero-tax-liens.jpg";
import heroBadTenants from "@/assets/hero-bad-tenants.jpg";
import heroCodeViolations from "@/assets/hero-code-violations.jpg";
import heroFireDamage from "@/assets/hero-fire-damage.jpg";
import heroHoarder from "@/assets/hero-hoarder.jpg";
import heroBankruptcy from "@/assets/hero-bankruptcy.jpg";
import heroJobLoss from "@/assets/hero-job-loss.jpg";
import heroMedicalBills from "@/assets/hero-medical-bills.jpg";
import heroTiredLandlord from "@/assets/hero-tired-landlord.jpg";

export interface SituationConfig {
  slug: string;
  label: string;
  heroImage: string;
  headline: string;
  subheadline: string;
  bodyParagraphs: string[];
  bullets: string[];
  videoCaptionLines: string[];
  beforeTitle: string;
  beforeBody: string;
  afterTitle: string;
  afterBody: string;
  warningTitle: string;
  warningBody: string;
  caseStudyDisclaimer: string;
  noEquityBeforeBody?: string;
  noEquityAfterBody?: string;
  faqs: { q: string; a: string }[];
  urgencyLine: string;
  whyTarekBody: string[];
  finalCtaHeadline: string;
  finalCtaSubline: string;
  smsPrefilledText: string;
  metaTitle: string;
  metaDescription: string;
}

const defaultWhyTarek = [
  "I'm Tarek El Moussa — you might know me from HGTV's Flip or Flop and The Flipping El Moussas. I've been buying and flipping houses for over 15 years. My team has purchased more than 1,000 homes nationwide.",
  "When you work with us, you're not dealing with some faceless corporation. You're working with my personal team here in {market}. We answer our phones, we show up when we say we will, and we close when we say we'll close. That's my reputation on the line — and I don't take that lightly.",
];

const defaultDisclaimer =
  "Story represents a typical outcome based on transactions closed by our buying team. Details reflect a composite of similar situations. Individual results vary.";

const heroImg = "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/divorce_c5ebfe54.png";

export const SITUATIONS: Record<string, SituationConfig> = {
  // ─── 1. DIVORCE ──────────────────────────────────────────────
  divorce: {
    slug: "divorce",
    label: "Divorce",
    heroImage: heroImg,
    headline: "The House Is the Last Thing\nKeeping You Stuck.",
    subheadline: "",
    bodyParagraphs: [
      "I've been through a divorce. I know what it's like when the house becomes the thing neither of you can move past. My team handles the sale privately — no signs, no MLS, no neighbors whispering. Both parties get paid fairly, and you both get to start over. In {market}'s current market, a house that sat for 6 months with an agent just means 6 more months of mortgage payments you're splitting with someone you're trying to leave.",
    ],
    bullets: [
      "Completely private — no yard signs, no listing, no open houses",
      "We coordinate with both parties, both attorneys, and the court if needed",
      "Fair cash offer with clean split — close on your settlement timeline",
    ],
    videoCaptionLines: [
      "Going through a divorce? We handle it privately.",
      "No yard signs. No MLS. No open houses.",
      "Fair cash offer — close on your timeline.",
      "Both parties get paid. Both move on.",
      "Text me — I've been through it too.",
    ],
    beforeTitle: "A Divorce Sale",
    beforeBody:
      "Contested divorce dragging on for 11 months. House was the last unresolved asset. Neither party willing to list traditionally — too public, too slow, too many strangers. Mortgage payments draining both sides at $3,200/month while attorneys billed hourly.",
    afterTitle: "After Working With Us",
    afterBody:
      "Cash offer accepted by both parties within 48 hours. Closed in 14 days. Funds split per settlement agreement. No showings, no signs, no public record of distressed sale. Both parties closed on new rentals within the month.",
    warningTitle: "What Happens If You Don't Call Us",
    warningBody:
      "The house sits. The mortgage keeps coming due — split between two people who can't agree on anything. Your attorneys keep billing. The settlement drags for another 6 months. Every month of delay costs you thousands in carrying costs and legal fees. The house becomes the reason the divorce never ends.",
    caseStudyDisclaimer: defaultDisclaimer,
    faqs: [
      { q: "What if my spouse and I can't agree on anything?", a: "That's exactly why we exist. Our cash offer removes the negotiation. It's based on the market, not emotions. Both attorneys review and approve. We've handled dozens of cases where the parties weren't speaking — we work through the attorneys." },
      { q: "Do both people on the deed have to agree to sell?", a: "Generally, yes — both parties on the deed need to sign off on the sale. However, if there's a court order mandating the sale, we can work within that framework. Your attorney can guide the specifics of your situation." },
      { q: "Will anyone find out we're selling?", a: "No. We never list on the MLS, never put a sign in the yard, never hold open houses. The only people who know are you, your attorneys, and our team. Complete privacy is one of our core promises." },
      { q: "How do you handle the money split?", a: "The title company distributes funds according to your settlement agreement or court order. We don't decide who gets what — that's between you, your spouse, and your attorneys. We just make sure the house sells quickly and fairly." },
      { q: "Can you work directly with our attorneys?", a: "Absolutely. In fact, we prefer it. We coordinate with both parties' attorneys to make sure everything is handled properly. Many attorneys in the area have worked with us before and trust our process." },
      { q: "What if there's a lien or second mortgage on the house?", a: "We handle properties with liens, second mortgages, and other title issues regularly. Our title company works through any encumbrances as part of the closing process. We'll give you a clear picture of where you stand before you commit." },
    ],
    urgencyLine: "Every month that house stays in both your names costs you money, sleep, and the future you're trying to build.",
    whyTarekBody: defaultWhyTarek,
    finalCtaHeadline: "Ready to Sell Your House?",
    finalCtaSubline: "Get a fair cash offer in 24 hours. No fees. No repairs. No obligation. Just text or call.",
    smsPrefilledText: "Hi Tarek, I need to sell my house — going through a divorce",
    metaTitle: "Sell Your House During Divorce — Private Cash Offer",
    metaDescription: "Going through a divorce? Get a private, fair cash offer from Tarek El Moussa's team. No signs, no MLS, no open houses. Close on your settlement timeline.",
  },

  // ─── 2. FORECLOSURE ─────────────────────────────────────────
  foreclosure: {
    slug: "foreclosure",
    label: "Foreclosure",
    heroImage: heroForeclosure,
    headline: "Stop Your {market}\nForeclosure.\nGet a Fair Cash Offer\nBefore Your Auction Date.",
    subheadline: "",
    bodyParagraphs: [
      "If you've received a notice from the bank, you still have options — more than you might think. My team can make you a fair cash offer and close before your foreclosure date, protecting your credit and keeping your equity out of the bank's hands. We're actively buying houses in {market} right now, and we move fast.",
      "Let's be straightforward: a cash offer prioritizes speed and certainty over maximum market price. Our goal is to give you a fair offer that solves your problem now — so you can move forward with dignity and cash in hand.",
    ],
    bullets: [
      "Close in as little as 7 days — before your auction date",
      "Protect your credit from a 7-year foreclosure mark",
      "All transactions handled by a licensed third-party title company",
    ],
    videoCaptionLines: [
      "Facing foreclosure? You still have options.",
      "We close fast — before the bank takes your house.",
      "Protect your credit. Walk away with cash.",
      "No fees. No commissions. No judgment.",
      "Call us today — time is critical.",
    ],
    beforeTitle: "A Foreclosure Save",
    beforeBody: "Homeowner received foreclosure notice with 45 days until auction. Three months behind on payments. Traditional listing would take 90+ days. Bank wouldn't negotiate. Credit score dropping every month.",
    afterTitle: "After Working With Us",
    afterBody: "Cash offer made within 24 hours. Closed in 12 days — 33 days before the auction date. Homeowner walked away with $47K in equity that would have gone to the bank. Foreclosure avoided, credit protected.",
    noEquityBeforeBody: "Homeowner was $32K underwater on their mortgage after market downturn. Bank filed foreclosure. A traditional sale wouldn't cover the mortgage balance. Credit was dropping every month with missed payments.",
    noEquityAfterBody: "We negotiated a short sale with the lender — they accepted less than what was owed. Homeowner avoided foreclosure, saved their credit from a 100+ point drop, walked away with a clean slate and no deficiency judgment. Closed in 19 days.",
    warningTitle: "What Happens If You Wait",
    warningBody: "The auction date doesn't move. Every day you wait, the bank's legal fees eat into your potential equity — meaning you walk away with less. Once the bank forecloses, it stays on your credit for 7 years, blocking your ability to buy again. Acting now puts you back in control.",
    caseStudyDisclaimer: defaultDisclaimer,
    faqs: [
      { q: "Can you really close before my foreclosure date?", a: "Yes. We've closed in as little as 7 days. As long as there's enough time to process the title work, we can typically beat your auction date. The sooner you call, the more time we have to work with." },
      { q: "Will I owe anything after the sale?", a: "In most cases, no. If your house is worth more than what you owe, you walk away with the difference in cash. If you're underwater, we can sometimes negotiate with your lender for a short sale. Every situation is different — call us and we'll give you a clear picture." },
      { q: "Will this affect my credit?", a: "Selling before foreclosure is significantly better for your credit than letting the bank take the house. A foreclosure stays on your record for 7 years. A regular sale — even a fast cash sale — doesn't carry that stigma." },
      { q: "How do you calculate your offer?", a: "We look at the After Repair Value (ARV) of your home based on comparable sales in your area, then subtract our estimated repair costs and a margin to keep our business running. We walk you through every number so you see exactly how we arrived at your offer — complete transparency." },
      { q: "What if I owe more than the house is worth?", a: "We specialize in negotiating with lenders. We can often arrange a short sale where the bank accepts less than what's owed, protecting your credit and letting you walk away clean — often at no cost to you." },
      { q: "Do I need to fix anything before selling?", a: "No. We buy houses as-is. Broken furnace, leaky roof, outdated everything — doesn't matter. We factor the condition into our offer so you don't have to spend a dime." },
    ],
    urgencyLine: "Every day you wait, the bank's legal fees eat into your equity. Acting now means you keep more of what's yours — and you take back control of your timeline.",
    whyTarekBody: [
      "I'm Tarek El Moussa — you might know me from HGTV's Flip or Flop and The Flipping El Moussas. Over 15 years and 1,000+ home purchases, I've developed a set of standards my team follows on every deal: radical transparency on our numbers, a dedicated local specialist from start to finish, and the flexibility to close on your timeline — not ours. We put that in writing.",
      "When you work with us, you get the security and financial backing of a trusted national brand, executed by a dedicated local team that lives in your community here in {market}. We answer our phones, we show up when we say we will, and we close when we say we'll close. That's my reputation on the line — and I don't take that lightly.",
    ],
    finalCtaHeadline: "Take the First Step to Solving This",
    finalCtaSubline: "Get your free, no-obligation cash offer in 24 hours. 100% confidential. Speak with our local specialist today.",
    smsPrefilledText: "Hi Tarek, I'm facing foreclosure and need to sell fast",
    metaTitle: "Sell Before Foreclosure — Fast Cash Offer",
    metaDescription: "Facing foreclosure? Tarek El Moussa's team can close in 7 days, protect your credit, and put cash in your pocket. Don't let the bank take everything.",
  },

  // ─── 3. INHERITED ───────────────────────────────────────────
  inherited: {
    slug: "inherited",
    label: "Inherited Property",
    heroImage: heroBehindPayments,
    headline: "You Inherited a House.\nNow You Need to Decide\nWhat to Do With It.",
    subheadline: "",
    bodyParagraphs: [
      "Losing someone is hard enough without having to deal with their property. Maybe the house needs work. Maybe it's in another state. Maybe multiple family members are on the title and can't agree. My team handles inherited property sales every week in {market} — we know the probate process, we buy as-is, and we make it simple.",
    ],
    bullets: [
      "We buy as-is — no cleanouts, no repairs, no staging",
      "We work with probate courts and estate attorneys",
      "Multiple heirs? We coordinate with everyone and split proceeds fairly",
    ],
    videoCaptionLines: [
      "Inherited a house you don't know what to do with?",
      "We buy as-is. No cleanouts. No repairs.",
      "We handle probate paperwork and court filings.",
      "Multiple heirs? We coordinate with everyone.",
      "Fair cash offer — close on your timeline.",
    ],
    beforeTitle: "An Inherited Property",
    beforeBody: "Three siblings inherited their parents' home. House hadn't been updated since the 1980s. One sibling lived out of state. Nobody wanted to invest in repairs. Property was costing $1,800/month in taxes, insurance, and utilities while sitting empty. Neighbors were starting to complain.",
    afterTitle: "After Working With Us",
    afterBody: "Cash offer made after one walkthrough. No repairs, no cleanout needed — we handled everything. Closed in 21 days. Proceeds split three ways per the estate plan. All three siblings were able to move forward without the burden of managing an inherited property.",
    warningTitle: "What Happens If You Keep Holding",
    warningBody: "An empty house deteriorates. Property taxes don't stop. Insurance on a vacant home is expensive. Vandalism, pipe bursts, squatters — these are real risks. And every month you hold it, you're paying carrying costs on an asset that's not generating income. The longer you wait, the less the house is worth.",
    caseStudyDisclaimer: defaultDisclaimer,
    faqs: [
      { q: "Does probate have to be complete before I can sell?", a: "Not always. In many states, we can begin the process during probate and close once the court grants authority. We work with probate attorneys regularly and can guide you through the timeline." },
      { q: "The house is full of stuff. Do I need to clean it out?", a: "No. We buy houses as-is, contents included. You can take what you want and leave the rest. We handle cleanouts as part of our process." },
      { q: "There are multiple heirs who can't agree. Can you still buy it?", a: "Yes. We've handled many multi-heir situations. We work with all parties and their attorneys to find a solution that works for everyone. Our cash offer often breaks the logjam because it removes the need to agree on listing price, repairs, or timeline." },
      { q: "The house needs a lot of work. Will that affect the offer?", a: "We factor the condition into our offer, but we never ask you to make repairs. We buy houses in any condition — hoarder homes, fire damage, foundation issues, you name it." },
      { q: "I live out of state. Do I need to be there?", a: "No. We can handle everything remotely. We use mobile notaries, virtual walkthroughs, and coordinate with local attorneys so you never have to fly in." },
      { q: "Are there tax implications I should know about?", a: "Inherited property typically receives a 'stepped-up basis' which can significantly reduce capital gains taxes. We always recommend consulting with a tax professional, but we can connect you with ones who specialize in inherited property sales." },
    ],
    urgencyLine: "Every month an inherited property sits empty, it costs you money and loses value. The best time to act was yesterday.",
    whyTarekBody: defaultWhyTarek,
    finalCtaHeadline: "Ready to Sell Your Inherited Property?",
    finalCtaSubline: "Get a fair cash offer in 24 hours. No repairs. No cleanout. No hassle. We handle everything.",
    smsPrefilledText: "Hi Tarek, I inherited a property and need to sell it",
    metaTitle: "Sell Inherited Property Fast — Cash Offer, No Repairs",
    metaDescription: "Inherited a house? Tarek El Moussa's team buys as-is, handles probate, and coordinates with all heirs. Fair cash offer, close in weeks.",
  },

  // ─── 4. BEHIND ON PAYMENTS ──────────────────────────────────
  "behind-on-payments": {
    slug: "behind-on-payments",
    label: "Behind on Payments",
    heroImage: heroMajorRepairs,
    headline: "Behind on Payments?\nYou Have More Options\nThan You Think.",
    subheadline: "",
    bodyParagraphs: [
      "When the mortgage is piling up and the letters keep coming, it feels like there's no way out. But you're not stuck. My {market} team can make a fair cash offer on your house, pay off your mortgage directly, and put the remaining equity in your pocket — before it turns into a foreclosure.",
    ],
    bullets: [
      "We pay off your mortgage directly at closing — no more letters",
      "Keep your credit intact by selling before foreclosure",
      "Close in as little as 7 days and walk away with cash",
    ],
    videoCaptionLines: [
      "Behind on mortgage payments?",
      "You're not stuck. You have options.",
      "We pay off your mortgage at closing.",
      "Protect your credit. Move forward.",
      "Call today — before it becomes a foreclosure.",
    ],
    beforeTitle: "Behind on Payments",
    beforeBody: "Homeowner was 4 months behind on a $2,400/month mortgage after a job loss. Lender started sending default notices. Credit score had already dropped 120 points. Traditional sale would take too long and require repairs they couldn't afford.",
    afterTitle: "After Working With Us",
    afterBody: "Cash offer within 24 hours. Closed in 10 days. We paid off the remaining mortgage balance directly with the lender. Homeowner walked away with $31K in equity and avoided foreclosure entirely. Credit saved.",
    warningTitle: "What Happens If You Keep Ignoring the Letters",
    warningBody: "The bank files a notice of default. Then a lis pendens. Then the auction date gets set. Each step damages your credit more and reduces your options. Once you're in active foreclosure, you lose leverage. Sell now while you still have choices.",
    caseStudyDisclaimer: defaultDisclaimer,
    faqs: [
      { q: "How far behind can I be and still sell?", a: "As long as the bank hasn't completed the foreclosure auction, we can usually help. The earlier you call, the more options we have. Even if you've received a notice of default, there's still time." },
      { q: "Will selling hurt my credit?", a: "Selling is far better for your credit than foreclosure. A foreclosure stays on your record for 7 years. A regular sale — even below market value — doesn't carry that mark. You could qualify for a new mortgage in as little as 2 years after selling." },
      { q: "What if I owe more than the house is worth?", a: "We can sometimes negotiate with your lender for a short sale. This is still much better than foreclosure. Call us and we'll run the numbers together." },
      { q: "Do I need to make any repairs?", a: "No. We buy as-is, regardless of condition. You don't need to spend a dime." },
      { q: "How fast can you close?", a: "We've closed in as little as 7 days. The typical timeline is 10-14 days. We move as fast as the title company and your lender allow." },
      { q: "Will my lender know I'm selling?", a: "Your lender will be notified as part of the payoff process at closing, which is standard for any home sale. But we handle all the communication with them directly." },
    ],
    urgencyLine: "Every missed payment digs the hole deeper. The sooner you act, the more equity you keep and the more credit you save.",
    whyTarekBody: defaultWhyTarek,
    finalCtaHeadline: "Stop the Letters. Sell Your House.",
    finalCtaSubline: "Get a cash offer in 24 hours. We pay off your mortgage, you keep the equity. No fees, no repairs, no judgment.",
    smsPrefilledText: "Hi Tarek, I'm behind on payments and need to sell",
    metaTitle: "Behind on Mortgage? Sell Fast for Cash",
    metaDescription: "Behind on mortgage payments? Tarek El Moussa's team pays off your mortgage at closing and puts cash in your pocket. Close in 7 days, protect your credit.",
  },

  // ─── 5. MAJOR REPAIRS ───────────────────────────────────────
  "major-repairs": {
    slug: "major-repairs",
    label: "Major Repairs Needed",
    heroImage: heroRelocating,
    headline: "Your House Needs Work\nYou Can't Afford.\nWe'll Buy It As-Is.",
    subheadline: "",
    bodyParagraphs: [
      "Foundation issues. Roof damage. Mold. Code violations. Whatever the problem, listing traditionally in {market} means spending tens of thousands on repairs before a single buyer walks through the door. Or you can call us. We buy houses in any condition — and I mean any condition. No repairs, no cleaning, no staging.",
    ],
    bullets: [
      "We buy in ANY condition — foundation, roof, mold, fire damage, hoarder homes",
      "No repairs, no cleaning, no inspections required",
      "Fair offer based on as-is value — close in as little as 7 days",
    ],
    videoCaptionLines: [
      "House needs major repairs?",
      "We buy in any condition. Literally any.",
      "No repairs. No cleaning. No inspections.",
      "Foundation, roof, mold — doesn't matter.",
      "Fair cash offer. Close in days, not months.",
    ],
    beforeTitle: "A House Needing Major Repairs",
    beforeBody: "Home had a failing foundation ($45K to fix), outdated electrical ($15K), and a roof nearing end of life ($12K). No traditional buyer would touch it without a $72K price reduction. Owner couldn't afford repairs and the house had been sitting for 8 months with a traditional agent.",
    afterTitle: "After Working With Us",
    afterBody: "We bought it as-is. No inspections, no repair requests, no renegotiations. Closed in 14 days. Owner received a fair price based on the as-is condition and moved on without spending a dollar on contractors.",
    warningTitle: "What Happens If You Try to List It",
    warningBody: "A traditional agent will tell you to make repairs first. Buyers will demand inspections, then ask for $50K+ in concessions. Deals will fall through when financing doesn't approve the condition. You'll spend months and thousands of dollars — and still might not sell.",
    caseStudyDisclaimer: defaultDisclaimer,
    faqs: [
      { q: "How bad can the house be?", a: "We've bought houses with collapsed roofs, severe mold, fire damage, foundation failures, and worse. If it has a deed, we can buy it. There is no condition too bad for us." },
      { q: "Don't I lose money selling as-is?", a: "Not necessarily. When you factor in repair costs, agent commissions (5-6%), carrying costs during a 90-180 day listing, and the risk of deals falling through — our cash offer often nets you more than a traditional sale after all expenses." },
      { q: "Do you need to inspect the house?", a: "We do a quick walkthrough to make our offer, but we don't do formal inspections. We're not going to use the condition against you — we already know we're buying as-is. What we see is what we buy." },
      { q: "What about code violations?", a: "We handle code violations regularly. Open permits, unpermitted additions, zoning issues — we deal with all of it after closing. You don't need to resolve any of it before selling to us." },
      { q: "Can I leave stuff in the house?", a: "Yes. Take what you want and leave the rest. Furniture, junk, personal items — we handle the cleanout. You don't need to lift a finger." },
      { q: "How do you determine the offer price?", a: "We look at what the house would be worth fully repaired, subtract our estimated repair costs and a margin, and make you a fair offer. We're transparent about our numbers — no hidden deductions or surprise fees." },
    ],
    urgencyLine: "Every month that house sits, it deteriorates more and becomes worth less. Deferred maintenance doesn't wait.",
    whyTarekBody: defaultWhyTarek,
    finalCtaHeadline: "Sell Your House As-Is. No Repairs.",
    finalCtaSubline: "Get a fair cash offer in 24 hours based on current condition. No contractors, no inspections, no stress.",
    smsPrefilledText: "Hi Tarek, my house needs major repairs and I want to sell as-is",
    metaTitle: "Sell Your House As-Is — No Repairs Needed",
    metaDescription: "House needs major repairs? Tarek El Moussa's team buys in any condition — foundation, roof, mold, fire damage. Fair cash offer, close in days.",
  },

  // ─── 6. RELOCATING ──────────────────────────────────────────
  relocating: {
    slug: "relocating",
    label: "Need to Relocate",
    heroImage: heroDownsizing,
    headline: "New Job, New City.\nYour Old House\nShouldn't Hold You Back.",
    subheadline: "",
    bodyParagraphs: [
      "You got the offer. The start date is in 3 weeks. You can't wait 90 days for a traditional sale in {market} — and you definitely can't afford two mortgages. My team gives you a cash offer and closes on your timeline so you can focus on your new chapter, not your old house.",
    ],
    bullets: [
      "Close on YOUR timeline — 7 days, 14 days, or whenever works",
      "No double mortgage payments while you wait for a buyer",
      "We handle everything remotely — you don't even need to be there",
    ],
    videoCaptionLines: [
      "Relocating for work? We close on your timeline.",
      "No waiting 90 days for a traditional sale.",
      "No double mortgage payments.",
      "We handle everything — even if you've already moved.",
      "Cash offer in 24 hours. Close in days.",
    ],
    beforeTitle: "A Relocation Sale",
    beforeBody: "New job starting in 3 weeks in another state. House wasn't ready for market — needed paint, carpet, and minor repairs. Agent said 60-90 days minimum. Couldn't afford two mortgages, moving costs, AND home repairs simultaneously.",
    afterTitle: "After Working With Us",
    afterBody: "Cash offer within 24 hours of first call. No repairs needed. Closed in 11 days — before the job start date. Owner moved with cash in pocket, no old mortgage hanging over them, and zero stress about a house 1,000 miles away.",
    warningTitle: "What Happens If You List Traditionally",
    warningBody: "You spend $5K-$15K on repairs and staging. Then wait 60-90 days hoping for an offer. Meanwhile you're paying two mortgages, utilities on an empty house, and flying back for showings. And if the deal falls through? You start over from 1,000 miles away.",
    caseStudyDisclaimer: defaultDisclaimer,
    faqs: [
      { q: "I've already moved. Can you still buy my house?", a: "Absolutely. We handle remote sales regularly. We can do the walkthrough ourselves, send you documents via mobile notary, and close without you ever coming back." },
      { q: "How fast can you actually close?", a: "Our fastest close was 5 days. Typical is 10-14 days. We work as fast as the title company allows. If you have a specific deadline (job start date, lease start, etc.), we'll work backwards from it." },
      { q: "What if my company is giving me relo benefits?", a: "Great — in many cases our offer can work alongside your company's relocation package. Some relo companies even prefer a guaranteed cash sale because it eliminates risk on their end. Let us know and we'll coordinate." },
      { q: "Do I need to make any repairs or clean the house?", a: "No. We buy as-is. Leave the furniture, leave the mess, leave everything. We handle it all after closing." },
      { q: "What about my mortgage — will you pay it off?", a: "Yes. At closing, the title company pays off your existing mortgage directly from the sale proceeds. You walk away clean with the remaining equity." },
      { q: "Can I choose my closing date?", a: "Yes. You tell us when you need to close and we work backwards from there. We're flexible — that's the whole point." },
    ],
    urgencyLine: "Two mortgages add up fast. The sooner you sell, the sooner you can go all-in on your next chapter.",
    whyTarekBody: defaultWhyTarek,
    finalCtaHeadline: "Sell Fast. Move On.",
    finalCtaSubline: "Get a cash offer in 24 hours. Close on your timeline. No repairs, no fees, no hassle.",
    smsPrefilledText: "Hi Tarek, I'm relocating and need to sell my house quickly",
    metaTitle: "Relocating? Sell Your House Fast for Cash",
    metaDescription: "Need to relocate fast? Tarek El Moussa's team closes in as little as 7 days. No repairs, no double mortgage. Cash offer in 24 hours.",
  },

  // ─── 7. DOWNSIZING ──────────────────────────────────────────
  downsizing: {
    slug: "downsizing",
    label: "Downsizing",
    heroImage: heroVacant,
    headline: "Your Kids Moved Out.\nYour House Is Too Big.\nLet's Make It Simple.",
    subheadline: "",
    bodyParagraphs: [
      "The kids are gone, the bedrooms are empty, and you're paying to heat 2,500 square feet you don't use. Downsizing should be exciting — not stressful. My {market} team gives you a cash offer so you can skip the staging, skip the showings, and move straight into the next chapter. No agent timelines. No strangers walking through your home.",
    ],
    bullets: [
      "Skip the 90-day listing process — cash offer in 24 hours",
      "No staging, no open houses, no weekend showings",
      "Close when YOU'RE ready — we match your timeline to your new home",
    ],
    videoCaptionLines: [
      "Ready to downsize? Make it easy.",
      "No staging. No open houses. No strangers.",
      "Cash offer in 24 hours.",
      "Close when your new place is ready.",
      "Your timeline, your terms.",
    ],
    beforeTitle: "A Downsizing Sale",
    beforeBody: "Empty nesters in a 4-bedroom home, paying $3,800/month on a house they used 40% of. Agent said they'd need $18K in updates to attract buyers. The thought of 3 months of showings while living there was overwhelming.",
    afterTitle: "After Working With Us",
    afterBody: "Cash offer accepted in 48 hours. Closed in 21 days — aligned perfectly with their new condo closing. No overlap, no double payments, no strangers in their home. They moved once, cleanly.",
    warningTitle: "The Hidden Costs of Staying",
    warningBody: "Every month in an oversized home means oversized utility bills, oversized maintenance, and oversized property taxes. A $4K/month carrying cost means $48K/year going to a house that no longer fits your life. That money could be funding your retirement, your travel, your freedom.",
    caseStudyDisclaimer: defaultDisclaimer,
    faqs: [
      { q: "Do I need to empty the house before selling?", a: "No. Take what you want to your new place and leave the rest. We handle full cleanouts — furniture, attic stuff, garage, basement, everything." },
      { q: "Can you coordinate with my new home purchase?", a: "Yes. We set our closing date to align with your new home's closing so you only move once. No storage units, no temporary housing." },
      { q: "Will I get a fair price without listing on the MLS?", a: "Our offer is based on comparable sales data in your neighborhood. While a cash offer prioritizes speed and certainty, many downsizers find the savings on commissions, repairs, and carrying costs make our net offer competitive." },
      { q: "What if the house needs updating?", a: "Doesn't matter. We buy as-is. Outdated kitchen, old carpet, original bathrooms — we handle all renovations after closing." },
      { q: "How does the process work?", a: "You call or text, we schedule a quick walkthrough, make a cash offer within 24 hours, and close on your timeline. Start to finish, most downsizers are done in 2-3 weeks." },
    ],
    urgencyLine: "Every month in a too-big house is another month of paying for space you don't need. Your next chapter is waiting.",
    whyTarekBody: defaultWhyTarek,
    finalCtaHeadline: "Ready to Downsize Without the Drama?",
    finalCtaSubline: "Cash offer in 24 hours. Close on your timeline. Move once, move right.",
    smsPrefilledText: "Hi Tarek, I'm looking to downsize and sell my house",
    metaTitle: "Downsizing? Sell Your House Fast — No Showings",
    metaDescription: "Ready to downsize? Skip the listing drama. Tarek El Moussa's team makes a cash offer in 24 hours. No repairs, no showings, close on your timeline.",
  },

  // ─── 8. VACANT PROPERTY ─────────────────────────────────────
  "vacant-property": {
    slug: "vacant-property",
    label: "Vacant Property",
    heroImage: heroTaxLiens,
    headline: "That Empty House\nIs Costing You Money\nEvery Single Month.",
    subheadline: "",
    bodyParagraphs: [
      "A vacant house doesn't just sit there — it bleeds cash. Property taxes, insurance (often double for vacant homes), lawn maintenance, vandalism risk, and the slow decay that comes from a house nobody's living in. If you own a vacant property in {market}, my team will buy it as-is and close fast — before another month's carrying costs come due.",
    ],
    bullets: [
      "Stop paying taxes, insurance, and maintenance on a house nobody lives in",
      "We buy as-is — no cleanout, no lawn care, no winterization needed",
      "Close in as little as 10 days and stop the cash bleed",
    ],
    videoCaptionLines: [
      "Own a vacant property?",
      "Taxes, insurance, maintenance — it adds up fast.",
      "We buy as-is. No cleanout needed.",
      "Stop the cash bleed. Close in days.",
      "Cash offer — your timeline.",
    ],
    beforeTitle: "A Vacant Property",
    beforeBody: "Home had been empty for 14 months after owner moved for work. Carrying costs: $2,100/month (taxes, insurance, lawn service, utilities to prevent pipe freeze). Vandals broke two windows. City sent a code violation letter. Total cost of vacancy: over $29K.",
    afterTitle: "After Working With Us",
    afterBody: "Bought as-is with broken windows and overgrown yard. Closed in 12 days. Owner stopped hemorrhaging $2,100/month instantly. No repairs, no cleanout, no more worrying about what's happening to an empty house 300 miles away.",
    warningTitle: "The True Cost of Keeping a Vacant Home",
    warningBody: "Vacant homes cost 2-3x more to insure. Pipes freeze. Squatters move in. Code violations pile up. And the house depreciates faster because no one's maintaining it. Every month you hold it, you're paying to own a liability — not an asset.",
    caseStudyDisclaimer: defaultDisclaimer,
    faqs: [
      { q: "The house has been vacant for years. Is it too far gone?", a: "No. We buy houses in any condition. Years of vacancy means deferred maintenance, and we're experts at that. Foundation issues, mold, pest damage — we've seen it all and we still buy." },
      { q: "I'm out of state. How does this work?", a: "Most vacant property sales are remote. We handle the walkthrough, send documents to a mobile notary near you, and close without you ever visiting the property." },
      { q: "What about the stuff left inside?", a: "Leave everything. We handle full cleanouts after closing." },
      { q: "Do I need to fix code violations first?", a: "No. We deal with code violations after closing. We'll even contact the city on your behalf once the title transfers." },
      { q: "What if there's no electricity or water?", a: "Doesn't matter. We buy properties without utilities running. Our walkthrough doesn't require them." },
    ],
    urgencyLine: "Every month a vacant home sits, it costs you money and loses value. Sell it before the next tax bill arrives.",
    whyTarekBody: defaultWhyTarek,
    finalCtaHeadline: "Stop Paying for an Empty House.",
    finalCtaSubline: "Get a cash offer in 24 hours. Close in days. No more carrying costs.",
    smsPrefilledText: "Hi Tarek, I have a vacant property I need to sell",
    metaTitle: "Sell a Vacant Property Fast — Stop the Cash Bleed",
    metaDescription: "Vacant property draining your wallet? Tarek El Moussa's team buys as-is, closes in days, and stops the carrying costs. Cash offer in 24 hours.",
  },

  // ─── 9. TAX LIENS ──────────────────────────────────────────
  "tax-liens": {
    slug: "tax-liens",
    label: "Tax Liens",
    heroImage: heroBadTenants,
    headline: "Tax Liens Piling Up?\nSell Before the County\nTakes Your House.",
    subheadline: "",
    bodyParagraphs: [
      "When property taxes go unpaid, the county doesn't wait forever. Tax liens accrue interest and penalties, and eventually, the county can auction your house — often for far less than it's worth. My {market} team has experience buying properties with tax liens. We pay off the liens at closing and put the remaining equity in your pocket.",
    ],
    bullets: [
      "We pay off tax liens directly at closing — you keep the remaining equity",
      "Stop interest and penalties from growing every month",
      "Avoid a county tax sale where your house sells for pennies on the dollar",
    ],
    videoCaptionLines: [
      "Tax liens on your property?",
      "We pay them off at closing.",
      "You keep the remaining equity.",
      "Don't let the county auction your home.",
      "Call today — interest keeps growing.",
    ],
    beforeTitle: "A Tax Lien Property",
    beforeBody: "Homeowner owed $34K in back property taxes with 18% annual penalties accumulating. County had initiated tax lien proceedings. No traditional buyer would touch the title complexity. The owner was 6 months from a tax auction.",
    afterTitle: "After Working With Us",
    afterBody: "We paid the $34K lien at closing, cleared the title through our title company, and the owner walked away with $58K in remaining equity. Closed in 17 days — well before the auction date. Clean slate.",
    warningTitle: "What Happens If You Ignore Tax Liens",
    warningBody: "Penalties compound monthly — often at 12-18% annually. Eventually the county will sell your house at auction, often for the lien amount alone. You'll lose the entire equity in your home because of unpaid taxes. Once the auction happens, there's no getting it back.",
    caseStudyDisclaimer: defaultDisclaimer,
    faqs: [
      { q: "Can you really buy a house with tax liens?", a: "Yes. We do it regularly. Our title company handles the lien payoff at closing. The liens are satisfied, the title is cleared, and you walk away clean." },
      { q: "How much of my equity will I keep?", a: "You keep everything above the lien amount and our purchase price. We'll show you the exact numbers before you commit — full transparency." },
      { q: "What if the liens are more than the house is worth?", a: "If the liens exceed equity, we can sometimes still help by negotiating with the taxing authority or finding creative solutions. Call us — we'll give you an honest assessment." },
      { q: "How close to auction can you still help?", a: "The sooner the better, but we've closed within 10 days of scheduled auctions. Call as soon as possible so we have maximum time to work." },
      { q: "Do I need to pay anything upfront?", a: "No. We cover all closing costs. The liens are paid from the sale proceeds at closing. You never write a check." },
    ],
    urgencyLine: "Tax lien penalties compound every month. The longer you wait, the less equity you keep.",
    whyTarekBody: defaultWhyTarek,
    finalCtaHeadline: "Clear Your Tax Liens. Keep Your Equity.",
    finalCtaSubline: "Cash offer in 24 hours. We pay the liens at closing. You walk away clean.",
    smsPrefilledText: "Hi Tarek, I have tax liens on my property and need to sell",
    metaTitle: "Sell a House With Tax Liens — We Pay Them Off",
    metaDescription: "Tax liens on your property? Tarek El Moussa's team pays them off at closing and puts remaining equity in your pocket. Don't lose your home to auction.",
  },

  // ─── 10. BAD TENANTS ────────────────────────────────────────
  "bad-tenants": {
    slug: "bad-tenants",
    label: "Bad Tenants",
    heroImage: heroCodeViolations,
    headline: "Bad Tenants Destroying\nYour Investment?\nSell the Problem to Us.",
    subheadline: "",
    bodyParagraphs: [
      "Non-paying tenants. Property damage. Eviction costs. Legal headaches. Being a landlord in {market} was supposed to build wealth — not drain it. If you're done dealing with tenant nightmares, my team will buy your rental property as-is, even with tenants still in place. We handle the tenant situation after closing. You walk away clean.",
    ],
    bullets: [
      "We buy with tenants in place — no need to evict first",
      "No repairs, no cleaning, no property management hassles",
      "Cash offer in 24 hours — stop losing money every month",
    ],
    videoCaptionLines: [
      "Nightmare tenants? We buy the property.",
      "Tenants in place? Doesn't matter.",
      "No eviction needed before selling.",
      "Stop the cash drain. Walk away clean.",
      "Fair cash offer — close in days.",
    ],
    beforeTitle: "A Bad Tenant Situation",
    beforeBody: "Landlord had a tenant 5 months behind on rent ($8,500 owed). Property had $12K in damage — holes in walls, broken appliances, carpet destroyed. Eviction process was taking 4+ months through the courts. Carrying costs of $1,900/month with zero income.",
    afterTitle: "After Working With Us",
    afterBody: "We bought the property with the tenant still inside. Owner didn't have to finish the eviction, didn't have to make repairs, didn't have to deal with one more day of landlord stress. Closed in 14 days. We handled everything after.",
    warningTitle: "What Happens If You Keep Trying",
    warningBody: "Evictions take 3-6 months in many jurisdictions. During that time, you're paying the mortgage with zero rental income. The tenant has no incentive to care for the property. Damage gets worse. Legal fees pile up. And even after eviction, you still need to make $10K-$30K in repairs before listing.",
    caseStudyDisclaimer: defaultDisclaimer,
    faqs: [
      { q: "Do I need to evict the tenant first?", a: "No. We buy properties with tenants in place. We handle the tenant situation after closing — that becomes our responsibility, not yours." },
      { q: "What if the tenant has damaged the property?", a: "We buy as-is, including tenant damage. Holes in walls, broken fixtures, destroyed carpet — we factor it all into our offer. You don't need to fix anything." },
      { q: "Can you close while the tenant is still living there?", a: "Yes. We purchase the property and assume any existing lease or tenant situation. You're completely released from the landlord role at closing." },
      { q: "What about the unpaid rent they owe me?", a: "Unpaid rent is a separate claim between you and the tenant. We can't collect that for you, but you may still pursue it independently. What we can do is stop the bleeding by buying the property so you stop losing more money each month." },
      { q: "I have multiple rental properties with issues. Can you buy them all?", a: "Yes. We regularly buy multiple properties from the same owner. We can package them into a single transaction or handle them separately — whatever works best for you." },
    ],
    urgencyLine: "Every month with a bad tenant is another month of lost rent, growing damage, and mounting stress. Sell the problem — not your sanity.",
    whyTarekBody: defaultWhyTarek,
    finalCtaHeadline: "Done With Bad Tenants? We'll Buy the Property.",
    finalCtaSubline: "Cash offer in 24 hours. Tenants in place, no problem. Close in days.",
    smsPrefilledText: "Hi Tarek, I have a rental property with bad tenants I need to sell",
    metaTitle: "Sell Rental Property With Bad Tenants — Cash Offer",
    metaDescription: "Bad tenants destroying your rental? Tarek El Moussa's team buys with tenants in place. No eviction needed. Cash offer, close in days.",
  },

  // ─── 11. CODE VIOLATIONS ────────────────────────────────────
  "code-violations": {
    slug: "code-violations",
    label: "Code Violations",
    heroImage: heroFireDamage,
    headline: "Code Violations?\nFines Piling Up?\nWe Buy It As-Is.",
    subheadline: "",
    bodyParagraphs: [
      "Open permits. Unpermitted additions. Zoning violations. City fines accumulating daily. In {market}, code issues can make a house nearly impossible to sell traditionally — buyers' lenders won't finance it, and fixing violations costs thousands. My team buys properties with code violations every week. We handle the city after closing. You get cash and walk away.",
    ],
    bullets: [
      "We buy with open permits, violations, and city fines — no need to resolve them",
      "No need to hire contractors, pull permits, or deal with inspectors",
      "Cash offer based on as-is condition — close in 7-14 days",
    ],
    videoCaptionLines: [
      "Code violations on your property?",
      "Fines piling up? We still buy.",
      "Open permits, unpermitted work — no problem.",
      "We deal with the city after closing.",
      "Cash offer. Close in days.",
    ],
    beforeTitle: "A Code Violation Property",
    beforeBody: "City had issued 4 active code violations — unpermitted garage conversion, expired roofing permit, fence height violation, and overgrown lot. Daily fines of $250 were accumulating. Estimated cost to fix all violations: $38K. No traditional buyer's lender would approve financing.",
    afterTitle: "After Working With Us",
    afterBody: "Bought as-is with all 4 violations open. We stopped the daily fines by taking ownership and engaging the city directly. Owner walked away with cash instead of spending $38K on fixes. Closed in 11 days.",
    warningTitle: "What Happens If You Ignore Code Violations",
    warningBody: "City fines compound daily or weekly. They can place a lien on your property. Eventually, they can condemn the house or force a sale. And while this is happening, you can't sell traditionally because no lender will finance a house with open violations. You're stuck — unless you sell to a cash buyer who knows how to handle it.",
    caseStudyDisclaimer: defaultDisclaimer,
    faqs: [
      { q: "What kinds of code violations do you handle?", a: "All of them. Open permits, unpermitted work, zoning violations, occupancy issues, setback violations, overgrown lots, condemned properties — we've seen it all and we still buy." },
      { q: "Do I need to resolve violations before selling?", a: "No. We buy with violations in place and resolve them after closing. That's our problem, not yours." },
      { q: "What about daily fines?", a: "Once we close and take ownership, the fines become our responsibility. We'll work with the city to resolve them. The sooner you sell, the sooner the fines stop accumulating against you." },
      { q: "Can a bank-financed buyer even purchase my house?", a: "Usually no — that's the problem. Lenders won't finance properties with open code violations. That's why a cash offer from us is often the only realistic path to selling." },
      { q: "Will the violations affect my offer price?", a: "Our offer accounts for the cost of resolving violations. We're transparent about the numbers — you'll see exactly how we calculated your offer." },
    ],
    urgencyLine: "City fines don't stop. Every day you wait costs more. Sell now and let us deal with the city.",
    whyTarekBody: defaultWhyTarek,
    finalCtaHeadline: "Let Us Handle the Code Violations.",
    finalCtaSubline: "Cash offer in 24 hours. We buy with violations in place. You walk away clean.",
    smsPrefilledText: "Hi Tarek, my house has code violations and I need to sell",
    metaTitle: "Sell a House With Code Violations — Cash, As-Is",
    metaDescription: "Code violations and fines piling up? Tarek El Moussa's team buys as-is, resolves violations after closing. Cash offer, close in days.",
  },

  // ─── 12. FIRE DAMAGE ────────────────────────────────────────
  "fire-damage": {
    slug: "fire-damage",
    label: "Fire Damage",
    heroImage: heroHoarder,
    headline: "Fire Damaged Your Home.\nWe'll Take It From Here.",
    subheadline: "",
    bodyParagraphs: [
      "A house fire changes everything in an instant. Between dealing with insurance, finding temporary housing, and facing the overwhelming cost of rebuilding, the last thing you need is a complicated sale process. My {market} team buys fire-damaged properties in any condition — partial damage, total loss, smoke damage only. We close fast so you can move forward.",
    ],
    bullets: [
      "We buy any level of fire damage — partial, total, or smoke-only",
      "Close before insurance negotiations drag on for months",
      "No contractors, no rebuild estimates, no cleanup required",
    ],
    videoCaptionLines: [
      "House damaged by fire?",
      "We buy in any condition — even total loss.",
      "No cleanup. No rebuild. No waiting on insurance.",
      "Cash offer. Close fast.",
      "Let's talk. One call can solve this.",
    ],
    beforeTitle: "A Fire-Damaged Property",
    beforeBody: "Kitchen fire spread to two adjoining rooms. Insurance was offering $85K for repairs the contractor quoted at $140K. House was uninhabitable. Owner was paying mortgage plus rent on a temporary apartment. Insurance company was dragging out the claim for 7 months.",
    afterTitle: "After Working With Us",
    afterBody: "Cash offer made based on as-is condition. Owner assigned the insurance claim proceeds and we coordinated directly with the carrier. Closed in 18 days. Owner stopped paying double housing costs and moved on with cash to start fresh.",
    warningTitle: "What Happens If You Wait for Insurance",
    warningBody: "Insurance companies don't rush. Claims take 6-12 months. During that time, you're paying mortgage on a house you can't live in, plus rent somewhere else. The insurance payout often doesn't cover full rebuild costs. And the house is deteriorating further — water damage, mold, structural decay. Sell now and simplify.",
    caseStudyDisclaimer: defaultDisclaimer,
    faqs: [
      { q: "How much fire damage is too much?", a: "There's no such thing as too much for us. Total loss, partial damage, smoke-only — we buy it all. If there's a lot and a deed, we can make an offer." },
      { q: "What about my insurance claim?", a: "You can either settle your claim independently or, in some cases, assign the claim proceeds as part of the sale. We'll walk through the options and help you figure out what nets you the most." },
      { q: "Do I need to clean up or board up the house?", a: "No. We handle everything after closing. No cleanup, no boarding, no securing the property." },
      { q: "What if the house is condemned?", a: "We buy condemned properties. Condemnation doesn't mean the land and remaining structure have no value. We'll make a fair offer based on what's there." },
      { q: "Can you close before my insurance settles?", a: "Yes. We don't need to wait for your insurance. We make our own assessment and offer based on current condition." },
    ],
    urgencyLine: "A fire-damaged house deteriorates fast — water, mold, and structural decay accelerate every week. The sooner you sell, the more it's worth.",
    whyTarekBody: defaultWhyTarek,
    finalCtaHeadline: "Sell Your Fire-Damaged Property. Start Fresh.",
    finalCtaSubline: "Cash offer in 24 hours. Any level of damage. We handle everything.",
    smsPrefilledText: "Hi Tarek, my house was damaged by fire and I need to sell",
    metaTitle: "Sell a Fire-Damaged House — Cash Offer, Any Condition",
    metaDescription: "House damaged by fire? Tarek El Moussa's team buys in any condition — no cleanup, no rebuild needed. Cash offer, close in days.",
  },

  // ─── 13. HOARDER HOUSE ──────────────────────────────────────
  "hoarder-house": {
    slug: "hoarder-house",
    label: "Hoarder House",
    heroImage: heroBankruptcy,
    headline: "The House Is Overwhelming.\nWe'll Buy It — Contents\nand All.",
    subheadline: "",
    bodyParagraphs: [
      "Nobody judges you here. Hoarding situations are more common than people realize — and they make selling a house feel impossible. The cleanout alone can cost $10K-$30K and take weeks. Traditional buyers won't walk through the door. My {market} team buys hoarder homes exactly as they are. We handle the entire cleanout after closing. You just take what matters to you and walk away.",
    ],
    bullets: [
      "We buy with everything inside — no cleanout required before selling",
      "Complete privacy — no listing photos, no public showings",
      "Our team handles the full cleanout after closing, professionally and respectfully",
    ],
    videoCaptionLines: [
      "House overwhelmed with belongings?",
      "No judgment. No cleanout needed.",
      "We buy with everything inside.",
      "Take what you want. We handle the rest.",
      "Private. Respectful. Fair cash offer.",
    ],
    beforeTitle: "A Hoarder Home",
    beforeBody: "Every room was floor-to-ceiling. Three dumpsters wouldn't have been enough. Two real estate agents had refused to list it. Professional cleanout bids came in at $18K-$26K. The owner was overwhelmed and ashamed to let anyone inside.",
    afterTitle: "After Working With Us",
    afterBody: "One private walkthrough with our acquisition manager — no judgment, no cameras, no photos. Cash offer made on the spot. Owner took personal items over a weekend. We handled the full cleanout professionally. Closed in 16 days.",
    warningTitle: "Why Traditional Sales Don't Work Here",
    warningBody: "An agent needs to photograph the home. Buyers need to walk through. Inspectors need access. None of that works with a hoarder house. You'd need to spend $15K-$30K on cleanout first, then repairs, then listing. That process takes 3-6 months and puts your situation on public display. We skip all of it.",
    caseStudyDisclaimer: defaultDisclaimer,
    faqs: [
      { q: "Do I need to clean anything before you buy?", a: "Nothing. Not a single item. Take what's important to you and leave everything else. We handle the full cleanout after closing with a professional crew." },
      { q: "Will you take photos of the inside?", a: "We take minimal notes for our offer estimate, but we never photograph or publicize the interior. Your privacy is absolute." },
      { q: "How do you make an offer if you can barely see the house?", a: "We assess the structure, square footage, lot size, and neighborhood comps. We've bought enough hoarder homes to accurately estimate the underlying property value regardless of contents." },
      { q: "What happens to everything inside?", a: "Our professional crew sorts through everything. Anything of value gets donated. The rest is disposed of properly. We're respectful and thorough." },
      { q: "Is this really common?", a: "More than you'd think. We buy several hoarder properties every month. You're not alone, and there's no reason to be embarrassed." },
    ],
    urgencyLine: "The longer you put it off, the more overwhelming it feels. One call starts the process — and we handle everything from there.",
    whyTarekBody: defaultWhyTarek,
    finalCtaHeadline: "We'll Buy It. Contents and All.",
    finalCtaSubline: "No cleanout. No judgment. No photos. Cash offer in 24 hours.",
    smsPrefilledText: "Hi Tarek, I have a house that needs a major cleanout before selling",
    metaTitle: "Sell a Hoarder House — No Cleanout Needed",
    metaDescription: "Hoarder house? Tarek El Moussa's team buys with everything inside. No cleanout, no judgment, no public listing. Cash offer, close in days.",
  },

  // ─── 14. BANKRUPTCY ─────────────────────────────────────────
  bankruptcy: {
    slug: "bankruptcy",
    label: "Bankruptcy",
    heroImage: heroJobLoss,
    headline: "Filing Bankruptcy?\nSelling Your House\nCan Help You Start Over.",
    subheadline: "",
    bodyParagraphs: [
      "Bankruptcy is a legal tool designed to give you a fresh start — and selling your house can be a strategic part of that process. My {market} team works directly with bankruptcy attorneys and court-appointed trustees to purchase properties during Chapter 7 and Chapter 13 proceedings. We move quickly, respect the court's timeline, and make the process as smooth as possible.",
    ],
    bullets: [
      "We coordinate directly with your bankruptcy attorney and trustee",
      "Court-compliant purchase process — we know the procedures",
      "Cash offer and fast closing helps satisfy creditors and finalize your case",
    ],
    videoCaptionLines: [
      "Going through bankruptcy?",
      "Selling your house can help you start fresh.",
      "We work with attorneys and trustees.",
      "Court-compliant process. Fast closing.",
      "Cash offer — let's talk.",
    ],
    beforeTitle: "A Bankruptcy Sale",
    beforeBody: "Chapter 7 filing. Court-appointed trustee needed to liquidate the house to satisfy creditors. Traditional listing would delay the entire bankruptcy by 4-6 months. Owner was living in limbo — couldn't move forward until the house sold.",
    afterTitle: "After Working With Us",
    afterBody: "We coordinated with the trustee and made a fair cash offer. Court approved the sale in 14 days. Closed 8 days later. Creditors were satisfied, the case was finalized, and the owner could finally start rebuilding their financial life.",
    warningTitle: "What Happens If the House Doesn't Sell",
    warningBody: "In bankruptcy, the house is often the largest asset. Until it sells, your case stays open. You can't get your discharge, can't start rebuilding credit, and can't truly start over. A fast cash sale accelerates everything — getting you to the other side sooner.",
    caseStudyDisclaimer: defaultDisclaimer,
    faqs: [
      { q: "Can I sell my house during bankruptcy?", a: "Yes, but the sale typically needs court approval. Your bankruptcy attorney and the trustee manage this process. We're experienced in working within these requirements." },
      { q: "Do you work with Chapter 7 and Chapter 13?", a: "Both. The process differs slightly, but we've handled sales under both chapters. We coordinate with your legal team to ensure everything is done properly." },
      { q: "How does the money work?", a: "Proceeds go through the bankruptcy estate and are distributed according to the court's order — paying creditors, exemptions, etc. Your attorney will explain exactly what you can expect to receive." },
      { q: "Will the court approve a cash sale?", a: "Courts generally view cash sales favorably because they're fast and certain. There's no financing contingency to fall through, which means less risk and faster case resolution." },
      { q: "How long does the court approval take?", a: "Typically 14-30 days once the motion is filed. We prepare all documentation your attorney needs to submit the motion quickly." },
    ],
    urgencyLine: "Your bankruptcy case can't close until the house is resolved. A fast sale accelerates your fresh start.",
    whyTarekBody: defaultWhyTarek,
    finalCtaHeadline: "Sell Your House. Finalize Your Bankruptcy.",
    finalCtaSubline: "Cash offer in 24 hours. Court-compliant process. We work with your attorney.",
    smsPrefilledText: "Hi Tarek, I'm going through bankruptcy and need to sell my house",
    metaTitle: "Sell Your House During Bankruptcy — Fast Cash Offer",
    metaDescription: "Filing bankruptcy? Sell your house fast with Tarek El Moussa's team. Court-compliant process, cash offer, close in days. We work with your attorney.",
  },

  // ─── 15. JOB LOSS ──────────────────────────────────────────
  "job-loss": {
    slug: "job-loss",
    label: "Job Loss",
    heroImage: heroMedicalBills,
    headline: "Lost Your Job?\nDon't Lose Your House\nTo the Bank Too.",
    subheadline: "",
    bodyParagraphs: [
      "A layoff hits hard — and the mortgage doesn't care about your employment status. If you're burning through savings to make payments on a house you can't afford right now, selling might be the smartest move to protect your credit and your future. My {market} team can close fast, put cash in your hand, and buy you the breathing room to land on your feet.",
    ],
    bullets: [
      "Sell before missed payments damage your credit",
      "Cash in your equity — use it to bridge until your next opportunity",
      "Close in 7-14 days, not 90-180 days like a traditional listing",
    ],
    videoCaptionLines: [
      "Lost your job? The mortgage doesn't stop.",
      "Sell before it damages your credit.",
      "Cash in your equity. Buy yourself time.",
      "Close in days. No repairs needed.",
      "This isn't giving up. It's being smart.",
    ],
    beforeTitle: "A Job Loss Sale",
    beforeBody: "Laid off after 12 years. Savings would cover 3 months of the $2,800 mortgage. Already applied to 40+ jobs with no offers yet. Didn't want to touch retirement funds. The stress of potential foreclosure was making the job search even harder.",
    afterTitle: "After Working With Us",
    afterBody: "Cash offer in 24 hours. Closed in 13 days. Owner walked away with $89K in equity — enough to cover 14 months of living expenses while job hunting. No missed payments on their record. Landed a new position 2 months later and bought a new home 8 months after that.",
    warningTitle: "What Happens If You Wait Too Long",
    warningBody: "Savings run out. You miss a payment. Then two. Then three. Then the bank starts foreclosure proceedings. Now your credit is damaged for 7 years, you have no savings, AND you've lost the house. Selling proactively preserves your credit and puts cash in your hand while you still have leverage.",
    caseStudyDisclaimer: defaultDisclaimer,
    faqs: [
      { q: "Should I sell or try to hold on?", a: "That depends on your savings runway. If you can cover 6+ months of payments while job hunting, holding might make sense. If you're looking at 2-3 months, selling proactively protects your credit and gives you cash to bridge the gap. We'll give you an honest assessment." },
      { q: "Will selling affect my credit?", a: "A regular home sale has zero negative impact on your credit. In fact, paying off your mortgage cleanly is a positive event. It's infinitely better than missed payments or foreclosure." },
      { q: "How fast can you close?", a: "As fast as 7 days. We understand that when funds are running low, every day matters. We move at the speed of the title company." },
      { q: "Do I need to make repairs?", a: "No. We buy as-is. You have enough on your plate — the last thing we'd ask is for you to spend money fixing up a house." },
      { q: "What if I find a job right after selling?", a: "That's actually the ideal scenario. You'll have cash from the sale, a clean credit record, and can buy again immediately. Many of our sellers in this situation buy a new home within 6-12 months." },
    ],
    urgencyLine: "Your savings have an expiration date. Sell while you still have options — not after they've run out.",
    whyTarekBody: defaultWhyTarek,
    finalCtaHeadline: "Protect Your Credit. Cash In Your Equity.",
    finalCtaSubline: "Free cash offer in 24 hours. No fees, no repairs. Close fast and land on your feet.",
    smsPrefilledText: "Hi Tarek, I lost my job and might need to sell my house",
    metaTitle: "Lost Your Job? Sell Your House Fast — Protect Your Credit",
    metaDescription: "Job loss threatening your mortgage? Sell your house fast with Tarek El Moussa's team. Cash offer in 24 hours, close in days. Protect your credit and equity.",
  },

  // ─── 16. MEDICAL BILLS ─────────────────────────────────────
  "medical-bills": {
    slug: "medical-bills",
    label: "Medical Bills",
    heroImage: heroTiredLandlord,
    headline: "Medical Bills Piling Up?\nYour House Can Be\nYour Safety Net.",
    subheadline: "",
    bodyParagraphs: [
      "A health crisis is stressful enough without the financial pressure of mounting medical bills. If your home equity is the key to paying for treatment, covering bills, or simply reducing financial stress during recovery, my {market} team can give you a fair cash offer and close on your timeline — so you can focus on what actually matters: getting better.",
    ],
    bullets: [
      "Cash in your home equity to pay medical bills or fund treatment",
      "Close on your timeline — as fast as 7 days if needed",
      "No repairs, no showings, no strangers in your home during recovery",
    ],
    videoCaptionLines: [
      "Medical bills piling up?",
      "Your home equity can be your safety net.",
      "Cash offer. Close on your timeline.",
      "No showings during recovery.",
      "Private. Respectful. No obligation.",
    ],
    beforeTitle: "A Medical Bills Sale",
    beforeBody: "Unexpected surgery left $94K in medical bills. Insurance covered 60%, leaving $37K out-of-pocket. Recovery period meant no work for 4 months. Mortgage, medical bills, and living expenses were draining savings at $7K/month. Traditional listing would require showings during recovery.",
    afterTitle: "After Working With Us",
    afterBody: "Cash offer made after a 20-minute walkthrough. Closed in 14 days. Owner paid off medical bills, covered living expenses during recovery, and moved to a smaller, more affordable home. Zero showings, zero stress during a critical recovery period.",
    warningTitle: "The Financial Spiral of Medical Debt",
    warningBody: "Medical bills don't wait for recovery. They go to collections, damage credit, and can even lead to liens on your property. Meanwhile, you're trying to heal. Selling your home proactively gives you the funds to handle bills while preserving your credit and peace of mind.",
    caseStudyDisclaimer: defaultDisclaimer,
    faqs: [
      { q: "I'm still recovering. Can I sell without being actively involved?", a: "Yes. We minimize your involvement. One walkthrough (or virtual if needed), paperwork via mobile notary, and we handle everything else. Your recovery comes first." },
      { q: "Can I sell from the hospital?", a: "We've done it. Mobile notaries can come to the hospital for signing. We make it work around your situation." },
      { q: "Will I have enough equity after the sale?", a: "We'll show you exact numbers before you commit — sale price minus mortgage payoff equals your equity. You'll know exactly what you'll walk away with and can decide if it makes sense for your situation." },
      { q: "What if I need to stay in the house during treatment?", a: "We can do a leaseback arrangement where you sell but continue living there for an agreed period. This gives you immediate cash while maintaining housing stability during treatment." },
      { q: "Is there financial assistance I should try first?", a: "Absolutely. We always encourage exploring hospital financial assistance programs, payment plans, and charity care first. Selling should be a deliberate choice, not a last resort. We're here if and when you decide it's the right move." },
    ],
    urgencyLine: "Medical debt compounds fast. Your home equity can be the bridge that gets you through this. Don't let bills go to collections when you have an asset that can solve the problem.",
    whyTarekBody: defaultWhyTarek,
    finalCtaHeadline: "Focus on Healing. We'll Handle the House.",
    finalCtaSubline: "Cash offer in 24 hours. Close on your timeline. No showings during recovery.",
    smsPrefilledText: "Hi Tarek, I have medical bills and may need to sell my house",
    metaTitle: "Sell Your House to Pay Medical Bills — Cash Offer",
    metaDescription: "Medical bills piling up? Sell your house to Tarek El Moussa's team. Cash offer in 24 hours, close on your timeline. No showings during recovery.",
  },

  // ─── 17. TIRED LANDLORD ─────────────────────────────────────
  "tired-landlord": {
    slug: "tired-landlord",
    label: "Tired Landlord",
    heroImage: heroTiredLandlord,
    headline: "Done Being a Landlord?\nSell Your Rental.\nGet Your Life Back.",
    subheadline: "",
    bodyParagraphs: [
      "Midnight plumbing calls. Chasing late rent. Dealing with turnover. Managing a rental property in {market} was supposed to be passive income — but there's nothing passive about it. If you're ready to exit the landlord game, my team will buy your rental property and close on your timeline. Even with tenants in place, deferred maintenance, or a property that needs work.",
    ],
    bullets: [
      "Sell with tenants in place — no need to wait for lease expiration",
      "No repairs or updates required — we buy as-is",
      "Cash offer means no buyer financing falling through",
    ],
    videoCaptionLines: [
      "Tired of being a landlord?",
      "Midnight calls. Late rent. Turnover.",
      "Sell the property. Get your life back.",
      "Tenants in place? No problem.",
      "Cash offer. Close on your terms.",
    ],
    beforeTitle: "A Tired Landlord",
    beforeBody: "Owner had managed a 3-unit property for 9 years. Deferred maintenance totaling $45K. One unit vacant, one tenant month-to-month, one on a lease expiring in 5 months. Yearly net income had dropped to $4K after expenses. The property was more burden than investment.",
    afterTitle: "After Working With Us",
    afterBody: "We bought all 3 units as-is with existing tenants. No repairs, no turnover waiting, no lease negotiations. Owner closed in 19 days and redirected the equity into a passive index fund — earning more with zero phone calls at midnight.",
    warningTitle: "The Real Cost of Holding a Bad Investment",
    warningBody: "A rental property making $4K/year net while requiring 20+ hours/month of management is paying you less than minimum wage. Meanwhile, the deferred maintenance grows, the property value drops, and finding quality tenants gets harder. Sometimes the smartest investment move is to sell and redeploy the capital where it actually works for you.",
    caseStudyDisclaimer: defaultDisclaimer,
    faqs: [
      { q: "Do I need to get rid of tenants first?", a: "No. We buy with tenants in place. We assume existing leases and handle all tenant relations after closing. You walk away completely." },
      { q: "What about deferred maintenance?", a: "We buy as-is. Deferred maintenance is factored into our offer. You don't need to fix anything — that's our job after closing." },
      { q: "I have multiple rentals. Can you buy them all?", a: "Yes. We regularly purchase portfolios from landlords exiting the business. We can buy them individually or as a package deal." },
      { q: "What are the tax implications of selling a rental?", a: "Rental property sales involve capital gains and depreciation recapture. We recommend consulting your CPA. Some sellers use 1031 exchanges to defer taxes, though that requires reinvesting in another property. We can connect you with specialists." },
      { q: "What if the property has delinquent tenants?", a: "We still buy. Delinquent tenants, evictions in progress, vacant units — none of it stops us. We handle the tenant situation after closing." },
      { q: "How do you value a rental property?", a: "We look at the property's condition, comparable sales, current rental income, and the local {market} market. We make an offer that works for both of us — and we show you how we got there." },
    ],
    urgencyLine: "Every month you hold a bad investment is a month your capital isn't working for you. The freedom on the other side is worth the call.",
    whyTarekBody: defaultWhyTarek,
    finalCtaHeadline: "Ready to Exit the Landlord Game?",
    finalCtaSubline: "Cash offer in 24 hours. Tenants in place, no problem. Close on your timeline.",
    smsPrefilledText: "Hi Tarek, I'm tired of being a landlord and want to sell my rental property",
    metaTitle: "Tired Landlord? Sell Your Rental Property for Cash",
    metaDescription: "Done being a landlord? Tarek El Moussa's team buys rental properties as-is, with tenants in place. Cash offer, close on your timeline. Get your life back.",
  },
};

export const DEFAULT_SITUATION = SITUATIONS.divorce;

export function getSituation(slug: string): SituationConfig | undefined {
  return SITUATIONS[slug];
}

export function getAllSituationSlugs(): string[] {
  return Object.keys(SITUATIONS);
}
