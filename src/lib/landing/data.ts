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
  whyTarek: {
    bodyParagraphs: string[];
    urgencyLine: string;
  };
  faqs: { q: string; a: string }[];
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
    whyTarek: {
      bodyParagraphs: [
        "Selling a house isn't always easy. The property may need major repairs, have difficult tenants, be tied to an inheritance, or have become too expensive to keep. You may be relocating, facing foreclosure, going through a divorce, or simply looking for a faster alternative to listing with an agent. Whatever your situation, Tarek El Moussa and his team can help you move forward.",
        "With more than 1,000 homes purchased nationwide, Tarek Buys Houses has the experience to handle properties in virtually any condition. We buy houses as-is, so you don't have to make repairs, clean everything out, schedule showings, or wait months for a buyer. You'll receive a fair cash offer with no obligation—and the freedom to choose a closing date that works for you.",
      ],
      urgencyLine:
        "Every day your home remains unsold, it costs you time, money, and emotional peace. Get your no-obligation cash offer today.",
    },
    faqs: [
      {
        q: "How fast can you buy my house?",
        a: "We can close on your home in as little as 7–14 days. We understand that some situations require a quick sale, so we work to keep the process moving and get you your cash as quickly as possible.",
      },
      {
        q: "Do I have to make repairs or stage my home?",
        a: "Absolutely not. We buy homes in any condition, completely as-is. You won't need to spend money or time on repairs, cleaning, or staging. This is especially helpful when your time, resources, or energy are already stretched thin.",
      },
      {
        q: "What if multiple owners can't agree on the sale price?",
        a: "We can provide a straightforward cash offer that may help everyone reach an agreement. Our goal is a fair, transparent transaction. We can work with all property owners and their legal counsel, when needed, to help facilitate a smooth sale.",
      },
      {
        q: "Will the sale be made public or require open houses?",
        a: "No. Our process is private and off-market. There are no public listings, \"for sale\" signs, or open houses. We respect your privacy and keep the sale confidential from start to finish.",
      },
      {
        q: "Are there any fees or commissions when I sell to you?",
        a: "There are no realtor commissions, hidden fees, or closing costs when you sell directly to us. The cash offer we provide is exactly what you get, allowing you to save thousands compared with a traditional real estate sale.",
      },
      {
        q: "How is selling to Tarek Buys Houses different from using a traditional agent?",
        a: "A traditional agent lists your home publicly, requires showings, and can take months to sell—often with repair demands and 5–6% commissions. We offer a direct cash purchase in days, require no repairs, provide complete privacy, and cover all closing costs. It's a faster, simpler solution for homeowners who want greater speed, certainty, and convenience.",
      },
    ],
  },
};

export const getLanding = (slug: string): LandingContent => LANDINGS[slug];

export const getAllLandingSlugs = (): string[] => Object.keys(LANDINGS);
