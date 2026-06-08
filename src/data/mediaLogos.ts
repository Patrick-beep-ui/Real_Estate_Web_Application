export interface MediaLogo {
  name: string;
  url: string;
  height?: number;
  width?: number;
}

export const MEDIA_LOGOS: MediaLogo[] = [
  { name: "HGTV", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/logo-hgtv_cd6b6bee.png" },
  { name: "CNN", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/logo-cnn-clean_2d36e600.png" },
  { name: "Forbes", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/logo-forbes_757883f7.png" },
  { name: "Fox Business", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/logo-fox-clean_239c08e4.png" },
  { name: "People", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/logo-people-clean_7f974877.png" },
  { name: "USA Today", url: "/images/usa_today_logo.webp", height: 10, width: 60 },
];
