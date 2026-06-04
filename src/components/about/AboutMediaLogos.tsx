const MEDIA_LOGOS = [
  { name: "HGTV", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/logo-hgtv_cd6b6bee.png" },
  { name: "CNN", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/logo-cnn-clean_2d36e600.png" },
  { name: "Forbes", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/logo-forbes_757883f7.png" },
  { name: "Fox Business", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/logo-fox-clean_239c08e4.png" },
  { name: "People", url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/logo-people-clean_7f974877.png" },
  { name: "USA Today", url: "/images/usa_today_logo.webp" },
];

export default function AboutMediaLogos() {
  return (
    <div className="bg-card border-y border-border/50 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <p className="text-xs text-muted-foreground font-semibold mb-4 uppercase tracking-widest text-center">
          As Featured On
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {MEDIA_LOGOS.map((logo) => (
            <img
              key={logo.name}
              src={logo.url}
              alt={logo.name}
              width={100}
              height={24}
              className="h-6 md:h-7 w-auto opacity-70 grayscale invert"
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
