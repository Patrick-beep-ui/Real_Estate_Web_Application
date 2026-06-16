export interface MediaLogo {
  name: string;
  url: string;
  href?: string;
  note?: string;
  height?: number;
  width?: number;
}

export const MEDIA_LOGOS: MediaLogo[] = [
  {
    name: "HGTV",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/logo-hgtv_cd6b6bee.png",
    href: "https://www.hgtv.com/shows/flip-or-flop",
    note: "Tarek El Moussa is a longtime HGTV host (Flip or Flop, Flipping 101, The Flipping El Moussas, The Flip Off)",
  },
  {
    name: "CNN",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/logo-cnn-clean_2d36e600.png",
    note: "UNVERIFIED — could not locate specific CNN article featuring Tarek Buys Houses",
  },
  {
    name: "Forbes",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/logo-forbes_757883f7.png",
    note: "UNVERIFIED — could not locate specific Forbes article featuring Tarek Buys Houses",
  },
  {
    name: "Fox Business",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/logo-fox-clean_239c08e4.png",
    href: "https://www.foxbusiness.com/media/hgtvs-tarek-el-moussa-sees-big-changes-future-real-estate-crash-cards",
    note: "Tarek interviewed on Fox & Friends about real estate market (Apr 2025)",
  },
  {
    name: "People",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/logo-people-clean_7f974877.png",
    href: "https://people.com/tag/tarek-el-moussa/",
    note: "People regularly covers Tarek El Moussa (tag page with multiple articles)",
  },
  {
    name: "USA Today",
    url: "/images/usa_today_logo.webp",
    href: "https://www.usatoday.com/story/entertainment/celebrities/2026/06/10/tarek-el-moussa-heather-rae-home-burglary-hgtv/90490800007/",
    height: 10,
    width: 60,
    note: "Article covers Tarek and Heather's home burglary — not directly about Tarek Buys Houses business",
  },
];
