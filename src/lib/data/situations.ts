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
import { DEFAULT_SMS_BODY } from "@/lib/shared/phone";
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
  traditionalPathBody: string;
  afterTitle: string;
  directPathBody: string;
  warningTitle: string;
  warningBody: string;
  noEquity?: {
    heading: string;
    body: string;
    options: { label: string; body: string }[];
  };
  storyId?: string;
  storySlug?: string;
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
    beforeTitle: "The Traditional Route",
    traditionalPathBody:
      "Listing a house during a divorce means both parties must agree on price, timing, and showings — while the property sits as the last unresolved asset in the settlement. Traditional sales take months and require public exposure at a time when privacy matters most.",
    afterTitle: "A Direct Sale",
    directPathBody:
      "A direct cash sale removes the public dimension entirely. The title company distributes funds per the settlement agreement, and the house sells without signs, showings, or listing photos — giving both parties a clean break.",
    warningTitle: "What Happens If You Wait",
    warningBody:
      "The house sits. The mortgage keeps coming due — split between two people who can't agree on anything. Your attorneys keep billing. The settlement drags. Every month of delay costs you thousands in carrying costs and legal fees. The house becomes the reason the divorce never ends.",
    noEquity: undefined,
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
    finalCtaSubline: "Get a fair cash offer. No fees. No repairs. No obligation. Just text or call.",
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
    beforeTitle: "The Traditional Route",
    traditionalPathBody:
      "A traditional listing requires the property to be in sellable condition, followed by 60–180 days on the market. When a foreclosure auction date is approaching, that timeline rarely works — and each missed payment further damages your credit.",
    afterTitle: "A Direct Sale",
    directPathBody:
      "A cash buyer can close before your auction date, protecting the equity that would otherwise go to the bank. The sale happens off-market with no repairs, no inspections, and no financing contingency to fall through.",
    warningTitle: "What Happens If You Wait",
    warningBody:
      "The auction date doesn't move. Every day you wait, the bank's legal fees eat into your potential equity — meaning you walk away with less. Once the bank forecloses, it stays on your credit for seven years, blocking your ability to buy again. Acting now puts you back in control.",
    noEquity: {
      heading: "Underwater on Your Mortgage?",
      body: "If you owe more than the house is worth, a traditional sale won't cover the mortgage balance — but you still have options. The key is understanding what each path means for your credit and your liability.",
      options: [
        {
          label: "Short Sale",
          body: "The lender agrees to accept less than what is owed. You avoid foreclosure, protect your credit from the full impact, and walk away without a deficiency judgment in most cases. The lender typically pays the agent commission out of the sale proceeds.",
        },
        {
          label: "Deed in Lieu of Foreclosure",
          body: "You transfer the property directly to the lender. This is faster than a short sale but may result in a deficiency judgment depending on your state and loan terms. Consult with an attorney about the specifics of your situation.",
        },
        {
          label: "Cash Buyer",
          body: "A cash buyer may still purchase the property even if it's underwater, coordinating a short sale with your lender as part of the transaction. This can simplify the process by handling both the sale and the lender negotiation in one step.",
        },
      ],
    },
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
    finalCtaSubline: "Get your free, no-obligation cash offer. 100% confidential. Speak with our local specialist today.",
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
    beforeTitle: "The Traditional Route",
    traditionalPathBody:
      "Selling an inherited property traditionally means coordinating repairs, cleanouts, and showings across multiple heirs — often in different states. The process can take months while property taxes, insurance, and utilities continue to accrue on a vacant house.",
    afterTitle: "A Direct Sale",
    directPathBody:
      "A direct cash sale lets the estate sell the property as-is, with the title company distributing proceeds per the estate plan. Multiple heirs can coordinate remotely — no need to agree on repairs, renovations, or listing timelines.",
    warningTitle: "Why Holding Costs Add Up",
    warningBody:
      "An empty house deteriorates. Property taxes don't stop. Insurance on a vacant home is often more expensive than standard coverage. And every month the property sits, it loses value from deferred maintenance. The longer you wait, the less the house is worth.",
    noEquity: undefined,
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
    finalCtaSubline: "Get a fair cash offer. No repairs. No cleanout. No hassle. We handle everything.",
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
    beforeTitle: "The Traditional Route",
    traditionalPathBody:
      "When mortgage payments are piling up, a traditional listing adds months of uncertainty — repairs, showings, and buyer financing contingencies — while the debt continues to grow. Each missed payment further damages your credit score.",
    afterTitle: "A Direct Sale",
    directPathBody:
      "A direct cash sale pays off your mortgage at closing and puts the remaining equity in your hand. There are no repairs, no financing contingency, and no months of waiting while the debt grows. The lender is satisfied, and you move forward with cash.",
    warningTitle: "What Happens If You Keep Ignoring the Letters",
    warningBody:
      "The bank files a notice of default. Then a lis pendens. Then the auction date gets set. Each step damages your credit more and reduces your options. Once you're in active foreclosure, you lose leverage. Sell now while you still have choices.",
    noEquity: undefined,
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
    finalCtaSubline: "Get a cash offer. We pay off your mortgage, you keep the equity. No fees, no repairs, no judgment.",
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
    beforeTitle: "The Traditional Route",
    traditionalPathBody:
      "Listing a house that needs major repairs means either investing tens of thousands upfront or accepting steep price reductions from buyers who will negotiate after inspection. Traditional buyers typically won't finance a home in poor condition, further limiting your pool.",
    afterTitle: "A Direct Sale",
    directPathBody:
      "A cash buyer purchases the property as-is — no repairs, no cleaning, no inspections required. The offer is based on current condition, and you skip the months of contractor estimates and failed showings.",
    warningTitle: "What Happens If You Try to List It",
    warningBody:
      "A traditional agent will tell you to make repairs first. Buyers will demand inspections, then ask for concessions. Deals will fall through when financing doesn't approve the condition. You'll spend months and money — and still might not sell.",
    noEquity: undefined,
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
    finalCtaSubline: "Get a fair cash offer based on current condition. No contractors, no inspections, no stress.",
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
      "Cash offer. Close in days.",
    ],
    beforeTitle: "The Traditional Route",
    traditionalPathBody:
      "Selling while relocating means managing a sale from a distance — or paying two mortgages while you wait. Traditional listings require repairs, showings, and months on market, none of which gets easier once you've already moved.",
    afterTitle: "A Direct Sale",
    directPathBody:
      "A cash sale closes on your timeline — before your job start date, before the second mortgage payment, or after you've already moved. The sale is handled remotely with a mobile notary, so you never need to fly back.",
    warningTitle: "What Happens If You List Traditionally",
    warningBody:
      "You spend money on repairs and staging. Then wait months hoping for an offer. Meanwhile you're paying two mortgages and utilities on an empty house. And if the deal falls through, you start over from a thousand miles away.",
    noEquity: undefined,
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
    finalCtaSubline: "Get a cash offer. Close on your timeline. No repairs, no fees, no hassle.",
    smsPrefilledText: "Hi Tarek, I'm relocating and need to sell my house quickly",
    metaTitle: "Relocating? Sell Your House Fast for Cash",
    metaDescription: "Need to relocate fast? Tarek El Moussa's team closes in as little as 7 days. No repairs, no double mortgage. Cash offer.",
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
      "Skip the 90-day listing process — cash offer",
      "No staging, no open houses, no weekend showings",
      "Close when YOU'RE ready — we match your timeline to your new home",
    ],
    videoCaptionLines: [
      "Ready to downsize? Make it easy.",
      "No staging. No open houses. No strangers.",
      "Cash offer.",
      "Close when your new place is ready.",
      "Your timeline, your terms.",
    ],
    beforeTitle: "The Traditional Route",
    traditionalPathBody:
      "Selling a larger home traditionally means staging rooms you no longer use, scheduling weekend showings, and waiting months for a buyer — all while paying for square footage you've already outgrown. Agents often require updates before listing.",
    afterTitle: "A Direct Sale",
    directPathBody:
      "A direct sale lets you skip the staging, showings, and months of waiting. The closing date can align with your new home's timeline so you move once — no storage units, no temporary housing, no overlap payments.",
    warningTitle: "The Hidden Costs of Staying",
    warningBody:
      "Every month in an oversized home means oversized utility bills, maintenance, and property taxes on space you don't use. That money could be funding your retirement, your travel, or your next chapter.",
    noEquity: undefined,
    faqs: [
      { q: "Do I need to empty the house before selling?", a: "No. Take what you want to your new place and leave the rest. We handle full cleanouts — furniture, attic stuff, garage, basement, everything." },
      { q: "Can you coordinate with my new home purchase?", a: "Yes. We set our closing date to align with your new home's closing so you only move once. No storage units, no temporary housing." },
      { q: "Will I get a fair price without listing on the MLS?", a: "Our offer is based on comparable sales data in your neighborhood. While a cash offer prioritizes speed and certainty, many downsizers find the savings on commissions, repairs, and carrying costs make our net offer competitive." },
      { q: "What if the house needs updating?", a: "Doesn't matter. We buy as-is. Outdated kitchen, old carpet, original bathrooms — we handle all renovations after closing." },
      { q: "How does the process work?", a: "You call or text, we schedule a quick walkthrough, make a cash offer and close on your timeline. Start to finish, most downsizers are done in 2-3 weeks." },
    ],
    urgencyLine: "Every month in a too-big house is another month of paying for space you don't need. Your next chapter is waiting.",
    whyTarekBody: defaultWhyTarek,
    finalCtaHeadline: "Ready to Downsize Without the Drama?",
    finalCtaSubline: "Cash offer. Close on your timeline. Move once, move right.",
    smsPrefilledText: "Hi Tarek, I'm looking to downsize and sell my house",
    metaTitle: "Downsizing? Sell Your House Fast — No Showings",
    metaDescription: "Ready to downsize? Skip the listing drama. Tarek El Moussa's team makes a cash offer. No repairs, no showings, close on your timeline.",
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
    beforeTitle: "The Traditional Route",
    traditionalPathBody:
      "Selling a vacant property traditionally means investing in repairs and cleanup to make it market-ready, then waiting months for a buyer — all while carrying costs continue to drain your finances on a house nobody lives in.",
    afterTitle: "A Direct Sale",
    directPathBody:
      "A cash buyer purchases the property as-is, regardless of condition or how long it's been empty. No cleanout, no repairs, no winterization needed. The carrying costs stop at closing.",
    warningTitle: "The True Cost of Keeping a Vacant Home",
    warningBody:
      "Vacant homes often cost more to insure than occupied ones. Pipes can freeze and burst. Vandalism and code violations are common risks. And the house depreciates faster because no one is maintaining it. Every month you hold it, you're paying to own a liability.",
    noEquity: undefined,
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
    finalCtaSubline: "Get a cash offer. Close in days. No more carrying costs.",
    smsPrefilledText: "Hi Tarek, I have a vacant property I need to sell",
    metaTitle: "Sell a Vacant Property Fast — Stop the Cash Bleed",
    metaDescription: "Vacant property draining your wallet? Tarek El Moussa's team buys as-is, closes in days, and stops the carrying costs. Cash offer.",
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
    beforeTitle: "The Traditional Route",
    traditionalPathBody:
      "Properties with tax liens are difficult to sell traditionally because the title is encumbered — most buyers' lenders won't approve financing until the liens are resolved. Meanwhile, penalties and interest continue to compound on the unpaid balance.",
    afterTitle: "A Direct Sale",
    directPathBody:
      "A cash buyer can pay off the tax liens at closing through the title company, clearing the title and putting any remaining equity in your pocket. The transaction happens without lender involvement, so the title complexity doesn't block the sale.",
    warningTitle: "What Happens If You Ignore Tax Liens",
    warningBody:
      "Penalties compound monthly and vary by jurisdiction, but they can be substantial. Eventually the county may sell your house at auction, often for the lien amount alone — meaning you lose the entire equity in your home. Once the auction happens, there's no getting it back.",
    noEquity: undefined,
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
    finalCtaSubline: "Cash offer. We pay the liens at closing. You walk away clean.",
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
      "Cash offer — stop losing money every month",
    ],
    videoCaptionLines: [
      "Nightmare tenants? We buy the property.",
      "Tenants in place? Doesn't matter.",
      "No eviction needed before selling.",
      "Stop the cash drain. Walk away clean.",
      "Fair cash offer — close in days.",
    ],
    beforeTitle: "The Traditional Route",
    traditionalPathBody:
      "Selling a rental with problem tenants traditionally requires completing the eviction first, then making repairs, then listing — a process that can take many months while you absorb the costs of vacancy, legal fees, and property damage.",
    afterTitle: "A Direct Sale",
    directPathBody:
      "A cash buyer can purchase the property with tenants still in place. You don't need to finish the eviction, make repairs, or manage one more day of landlord stress. The tenant situation becomes the buyer's responsibility at closing.",
    warningTitle: "What Happens If You Keep Trying",
    warningBody:
      "Evictions take time and vary widely by jurisdiction. During that period, you're paying the mortgage with zero rental income. Damage often continues to accumulate. And even after eviction, the property typically needs repairs before it can be listed.",
    noEquity: undefined,
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
    finalCtaSubline: "Cash offer. Tenants in place, no problem. Close in days.",
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
    beforeTitle: "The Traditional Route",
    traditionalPathBody:
      "Properties with code violations are difficult to sell traditionally because most buyers' lenders won't approve financing until the violations are resolved. Fixing violations can cost tens of thousands, and the fines continue to accumulate while you wait.",
    afterTitle: "A Direct Sale",
    directPathBody:
      "A cash buyer purchases the property with violations in place and resolves them after closing. You don't need to hire contractors, pull permits, or deal with inspectors — the cash offer is based on the as-is condition.",
    warningTitle: "What Happens If You Ignore Code Violations",
    warningBody:
      "City fines compound and vary by municipality, but they can include daily penalties and liens on your property. Meanwhile, you can't sell traditionally because no lender will finance a house with open violations. Selling to a cash buyer is often the only path that stops the accumulation.",
    noEquity: undefined,
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
    finalCtaSubline: "Cash offer. We buy with violations in place. You walk away clean.",
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
    beforeTitle: "The Traditional Route",
    traditionalPathBody:
      "Selling a fire-damaged property traditionally means waiting for insurance negotiations, hiring contractors for rebuild estimates, and listing a home that most traditional buyers won't touch. The process can take many months while you pay mortgage on a house you can't live in.",
    afterTitle: "A Direct Sale",
    directPathBody:
      "A cash buyer purchases the property in its current condition — partial damage, total loss, or smoke-only. There's no need to wait for insurance to settle, clean up debris, or board up the structure. The sale stops the double housing costs.",
    warningTitle: "What Happens If You Wait for Insurance",
    warningBody:
      "Insurance companies don't rush — claims can take many months. During that time, you're paying mortgage on a house you can't live in, plus rent somewhere else. The house continues to deteriorate from water damage, mold, and structural decay. Selling now simplifies the situation.",
    noEquity: undefined,
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
    finalCtaSubline: "Cash offer. Any level of damage. We handle everything.",
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
    beforeTitle: "The Traditional Route",
    traditionalPathBody:
      "Selling a hoarder home traditionally requires a full cleanout before listing — which can cost thousands and take weeks. Traditional buyers won't walk through the door, and agents can't photograph or show the property in its current state.",
    afterTitle: "A Direct Sale",
    directPathBody:
      "A cash buyer purchases the property with everything inside. You take what matters to you and leave the rest — the buyer handles the full cleanout after closing. No judgment, no photos, no public listing of the interior.",
    warningTitle: "Why Traditional Sales Don't Work Here",
    warningBody:
      "An agent needs to photograph the home. Buyers need to walk through. Inspectors need access. None of that works with a hoarder house. You'd need to spend money on cleanout first, then repairs, then listing — a process that takes months and puts your situation on public display.",
    noEquity: undefined,
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
    finalCtaSubline: "No cleanout. No judgment. No photos. Cash offer.",
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
    beforeTitle: "The Traditional Route",
    traditionalPathBody:
      "Selling a house during bankruptcy requires court approval, which means waiting for a motion to be filed and scheduled. A traditional listing adds months to an already lengthy process, delaying your discharge and your ability to start over.",
    afterTitle: "A Direct Sale",
    directPathBody:
      "A cash sale is court-compliant and typically moves faster than a traditional listing because there's no financing contingency to fall through. The court generally views cash sales favorably because they're certain and quick — helping accelerate your case.",
    warningTitle: "What Happens If the House Doesn't Sell",
    warningBody:
      "In bankruptcy, the house is often the largest asset. Until it sells, your case stays open. You can't get your discharge, can't start rebuilding credit, and can't truly start over. A faster sale accelerates everything — getting you to the other side sooner.",
    noEquity: undefined,
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
    finalCtaSubline: "Cash offer. Court-compliant process. We work with your attorney.",
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
    beforeTitle: "The Traditional Route",
    traditionalPathBody:
      "Selling after a job loss means listing while your savings are draining — repairs, showings, and months on market while the mortgage keeps coming due. If you miss payments before the sale closes, the credit damage compounds.",
    afterTitle: "A Direct Sale",
    directPathBody:
      "A cash sale puts your equity in hand quickly, without the months of uncertainty that come with a traditional listing. You preserve your credit by closing before missed payments become a pattern, and you have a financial bridge while you search for your next opportunity.",
    warningTitle: "What Happens If You Wait Too Long",
    warningBody:
      "Savings run out. Payments are missed. The bank starts foreclosure proceedings. Now your credit is damaged for seven years, you have no savings, and you've lost the house. Selling proactively preserves your credit and puts cash in your hand while you still have leverage.",
    noEquity: undefined,
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
    finalCtaSubline: "Free cash offer. No fees, no repairs. Close fast and land on your feet.",
    smsPrefilledText: "Hi Tarek, I lost my job and might need to sell my house",
    metaTitle: "Lost Your Job? Sell Your House Fast — Protect Your Credit",
    metaDescription: "Job loss threatening your mortgage? Sell your house fast with Tarek El Moussa's team. Cash offer, close in days. Protect your credit and equity.",
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
    beforeTitle: "The Traditional Route",
    traditionalPathBody:
      "Selling a home while recovering from a medical crisis means managing showings, repairs, and months of uncertainty during a time when you need rest, not stress. Traditional listing demands attention and energy that should be going toward recovery.",
    afterTitle: "A Direct Sale",
    directPathBody:
      "A direct sale minimizes your involvement — one walkthrough, paperwork via mobile notary, and the rest is handled for you. You get the funds to cover bills and living expenses without the burden of managing a sale during recovery.",
    warningTitle: "The Financial Spiral of Medical Debt",
    warningBody:
      "Medical bills don't wait for recovery. They go to collections, damage credit, and can lead to liens on your property. Meanwhile, you're trying to heal. Your home equity can be the bridge that handles the bills — but waiting reduces your options.",
    noEquity: undefined,
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
    finalCtaSubline: "Cash offer. Close on your timeline. No showings during recovery.",
    smsPrefilledText: "Hi Tarek, I have medical bills and may need to sell my house",
    metaTitle: "Sell Your House to Pay Medical Bills — Cash Offer",
    metaDescription: "Medical bills piling up? Sell your house to Tarek El Moussa's team. Cash offer, close on your timeline. No showings during recovery.",
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
    beforeTitle: "The Traditional Route",
    traditionalPathBody:
      "Selling a rental property traditionally means waiting for leases to expire, making repairs between tenants, and listing on the open market — a process that can take many months while the property continues to cost you money and time.",
    afterTitle: "A Direct Sale",
    directPathBody:
      "A cash buyer purchases the property with tenants in place and deferred maintenance included. You don't need to wait for lease expiration, make repairs, or manage turnover. The sale frees up capital that can work harder elsewhere.",
    warningTitle: "The Real Cost of Holding a Bad Investment",
    warningBody:
      "A rental property that costs more to maintain than it generates in income is paying you less than nothing — it's costing you every month. Meanwhile, deferred maintenance grows, property values can decline, and finding quality tenants gets harder. Sometimes the best investment move is to sell and redeploy the capital.",
    noEquity: undefined,
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
    finalCtaSubline: "Cash offer. Tenants in place, no problem. Close on your timeline.",
    smsPrefilledText: "Hi Tarek, I'm tired of being a landlord and want to sell my rental property",
    metaTitle: "Tired Landlord? Sell Your Rental Property for Cash",
    metaDescription: "Done being a landlord? Tarek El Moussa's team buys rental properties as-is, with tenants in place. Cash offer, close on your timeline. Get your life back.",
  },
};

export const DEFAULT_SITUATION: SituationConfig = {
  ...SITUATIONS.divorce,
  smsPrefilledText: DEFAULT_SMS_BODY,
};

export function getSituation(slug: string): SituationConfig | undefined {
  return SITUATIONS[slug];
}

export function getAllSituationSlugs(): string[] {
  return Object.keys(SITUATIONS);
}
