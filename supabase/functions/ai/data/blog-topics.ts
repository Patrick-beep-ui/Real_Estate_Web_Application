export interface TopicCategory {
  category: string;
  topics: string[];
}

export const TOPIC_CATEGORIES: TopicCategory[] = [
  {
    category: "market-trends",
    topics: [
      "Housing Market Update: What Home Sellers Need to Know Right Now",
      "Is It a Good Time to Sell Your House? A Nationwide Perspective",
      "How Rising Interest Rates Affect Home Sellers Across the US",
      "Housing Market Predictions: Should You Sell Now or Wait?",
      "How Inflation Impacts Your Home's Value",
      "The Truth About Home Values in a Cooling Market",
      "Why Cash Buyers Are More Active Than Ever in Today's Market",
      "What Pending Home Sales Tell Us About the Housing Market",
      "How the Fed's Decisions Affect Your Home Sale",
      "Understanding Home Equity: How Much Can You Really Walk Away With",
    ],
  },
  {
    category: "seller-guides",
    topics: [
      "Selling Your House During Divorce: What You Need to Know",
      "How to Avoid Foreclosure: Options Most Homeowners Don't Know About",
      "What to Do When You Can't Afford Your Mortgage Anymore",
      "How to Sell a House You Inherited: A Complete Guide",
      "Selling a House with Code Violations: Your Options Explained",
      "What Happens When You Stop Paying Your Mortgage",
      "How to Sell a House with Tenants Still Living in It",
      "Selling a Fire-Damaged House: What Are Your Options",
      "How to Sell a Hoarder House: A Compassionate Guide",
      "Probate Real Estate: How to Sell an Inherited Property Fast",
    ],
  },
  {
    category: "cash-offers",
    topics: [
      "Cash Offer vs. Traditional Sale: Which Is Better for You",
      "How Cash Home Buyers Determine Your Home's Value",
      "5 Red Flags When Getting a Cash Offer on Your House",
      "Why More Homeowners Are Choosing Cash Sales in Today's Market",
      "The Pros and Cons of Selling Your House for Cash",
      "How Fast Can You Actually Close on a Cash Sale",
      "What Documents Do You Need to Sell Your House for Cash",
      "Understanding the Cash Home Buying Process Step by Step",
      "How to Get the Best Cash Offer for Your Home",
      "Are Cash Home Buyers Legitimate? How to Tell",
    ],
  },
  {
    category: "real-estate-tips",
    topics: [
      "Should You Sell Your House As-Is or Make Repairs First",
      "The Top 5 Reasons Homes Sit on the Market Too Long",
      "What First-Time Home Sellers Wish They Knew",
      "How to Sell a House That Needs Major Repairs",
      "Understanding Your Home's Fair Market Value",
      "Why Your House Isn't Selling and What to Do About It",
      "The Emotional Side of Selling Your Home: How to Cope",
      "Moving Out of State? How to Sell Your Home Fast",
      "How to Sell a House with Foundation Issues",
      "What to Do When Your Home Appraisal Comes in Low",
    ],
  },
  {
    category: "local-insights",
    topics: [
      "How Property Taxes Affect Your Home Sale Across Different States",
      "Understanding Seller Disclosure Requirements by State",
      "How Natural Disasters Impact Home Values Across the US",
      "The Impact of Remote Work on Housing Markets Nationwide",
      "Understanding Capital Gains Tax When Selling Your Home",
      "HOAs and Home Sales: What Sellers Need to Know",
      "How State Laws Affect Foreclosure Timelines",
      "Homestead Exemptions: What They Mean for Home Sellers",
      "How Probate Laws Vary by State and Affect Your Home Sale",
      "Understanding Lis Pendens and How It Affects Your Property",
    ],
  },
];

export interface MarketLocation {
  slug: string;
  city: string;
  state: string;
}

export const MARKET_LOCATIONS: MarketLocation[] = [
  { slug: "tampa", city: "Tampa Bay", state: "FL" },
  { slug: "phoenix", city: "Phoenix Metro", state: "AZ" },
  { slug: "atlanta", city: "Atlanta Metro", state: "GA" },
  { slug: "dallas", city: "Dallas-Fort Worth", state: "TX" },
  { slug: "houston", city: "Houston Metro", state: "TX" },
  { slug: "charlotte", city: "Charlotte Metro", state: "NC" },
  { slug: "nashville", city: "Nashville Metro", state: "TN" },
  { slug: "jacksonville", city: "Jacksonville", state: "FL" },
  { slug: "orlando", city: "Orlando Metro", state: "FL" },
  { slug: "san-antonio", city: "San Antonio", state: "TX" },
  { slug: "las-vegas", city: "Las Vegas", state: "NV" },
  { slug: "denver", city: "Denver Metro", state: "CO" },
  { slug: "raleigh", city: "Raleigh-Durham", state: "NC" },
  { slug: "minneapolis", city: "Twin Cities", state: "MN" },
  { slug: "sacramento", city: "Sacramento", state: "CA" },
  { slug: "salt-lake-city", city: "Salt Lake City", state: "UT" },
  { slug: "tucson", city: "Tucson", state: "AZ" },
  { slug: "indianapolis", city: "Indianapolis", state: "IN" },
  { slug: "columbus", city: "Columbus", state: "OH" },
  { slug: "san-bernardino", city: "Inland Empire", state: "CA" },
  { slug: "los-angeles", city: "Los Angeles", state: "CA" },
  { slug: "san-diego", city: "San Diego", state: "CA" },
  { slug: "orange-county", city: "Orange County", state: "CA" },
  { slug: "san-francisco", city: "San Francisco Bay Area", state: "CA" },
  { slug: "san-jose", city: "San Jose", state: "CA" },
  { slug: "fresno", city: "Fresno", state: "CA" },
  { slug: "bakersfield", city: "Bakersfield", state: "CA" },
  { slug: "mesa", city: "Mesa-Gilbert", state: "AZ" },
  { slug: "scottsdale", city: "Scottsdale", state: "AZ" },
  { slug: "flagstaff", city: "Flagstaff-Sedona", state: "AZ" },
];
