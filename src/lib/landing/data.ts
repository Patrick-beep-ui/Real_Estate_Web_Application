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
  },
};

export const getLanding = (slug: string): LandingContent => LANDINGS[slug];

export const getAllLandingSlugs = (): string[] => Object.keys(LANDINGS);
