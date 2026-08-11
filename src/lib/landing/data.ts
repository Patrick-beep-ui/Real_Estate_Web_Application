export interface LandingContent {
  slug: string;
  name: string;
  marketSlug: string;
  situationSlug: string;
  source: string;
  hero: {
    locationLine: string;
  };
  tickerLocationName: string;
  howItWorksLocationName: string;
  video: {
    heading: string;
    subtitle: string;
    bodyParagraphs: string[];
    videoFile?: string;
    videoId?: string;
  };
  beforeAfter: {
    beforeTitle: string;
    beforeBody: string;
    afterTitle: string;
    afterBody: string;
    warningTitle: string;
    warningBody: string;
    disclaimer?: string;
  };
}

export const LANDINGS: Record<string, LandingContent> = {
  california: {
    slug: "california",
    name: "California",
    marketSlug: "california",
    situationSlug: "landing-california",
    source: "landing-california",
    hero: {
      locationLine: "Now Buying Homes Across California",
    },
    tickerLocationName: "California",
    howItWorksLocationName: "California",
    video: {
      heading: "Watch Before You Sell",
      subtitle: "60 seconds. This is exactly how we help California homeowners.",
      bodyParagraphs: [
        "When you need to sell a house because of a difficult situation or major life change, you need a partner you can trust to handle one of your biggest assets. That's where Tarek El Moussa and his team come in. You've seen Tarek transform homes on HGTV for years, building a reputation for integrity and getting results. He's not just a TV personality—he understands the emotional and financial complexities that can come with selling a property during an uncertain time.",
        "Tarek Buys Houses has purchased over 1,000 homes nationwide, helping homeowners through situations such as divorce, foreclosure, inherited properties, costly repairs, relocation, and unwanted rentals. We bring Tarek's proven expertise, efficiency, and empathetic approach to every transaction. Our commitment is to provide a fair, fast, and confidential solution, allowing you to move forward without the added stress of a prolonged home sale.",
      ],
    },
    beforeAfter: {
      beforeTitle: "Before Working With Us: Mounting Stress and Expenses",
      beforeBody:
        "Sarah and Mark, homeowners in Glendale, were stuck. Their house had been on the market for 90 days, but the offers were low and buyers wanted nearly $25,000 in repairs. Every showing meant more cleaning, disruption, and uncertainty. Meanwhile, the mortgage, property taxes, insurance, utilities, and maintenance costs continued to add up.",
      afterTitle: "After Working With Us: A Simple, As-Is Sale",
      afterBody:
        "Sarah and Mark contacted Tarek Buys Houses. Within 24 hours, we provided a fair cash offer for their Glendale home as-is. Ten days later, the sale was complete—with no repairs, showings, agent commissions, or additional delays. They stopped the mounting costs, walked away with cash, and were finally able to move forward.",
      warningTitle: "What Happens If You Wait to Sell?",
      warningBody:
        "Every month your home remains unsold can mean another round of mortgage payments, property taxes, insurance, utilities, maintenance, and unexpected repairs. A prolonged sale can also lead to more price reductions and added stress. Whether you're dealing with an inherited property, difficult tenants, foreclosure, divorce, relocation, or a house that needs major work, waiting can make the situation more expensive.",
    },
  },
};

export const getLanding = (slug: string): LandingContent => LANDINGS[slug];

export const getAllLandingSlugs = (): string[] => Object.keys(LANDINGS);
