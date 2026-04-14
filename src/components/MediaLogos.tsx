const MEDIA_LOGOS = [
  {
    name: "HGTV",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/logo-hgtv_cd6b6bee.png",
  },
  {
    name: "CNN",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/logo-cnn-clean_2d36e600.png",
  },
  {
    name: "Forbes",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/logo-forbes_757883f7.png",
  },
  {
    name: "Fox Business",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/logo-fox-clean_239c08e4.png",
  },
  {
    name: "People",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/logo-people-clean_7f974877.png",
  },
  {
    name: "USA Today",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/logo-usa-today-v2_7102f394.png",
  },
];

const MediaLogos = () => (
  <div className="mt-8 mb-6 rounded-xl p-6" style={{ background: "hsl(220, 25%, 12%)" }}>
    <p className="text-xs text-muted-foreground font-semibold mb-4 uppercase tracking-widest text-center">
      As Featured On
    </p>
    <div className="flex flex-wrap items-center justify-center gap-6">
      {MEDIA_LOGOS.map((logo) => (
        <img
          key={logo.name}
          src={logo.url}
          alt={logo.name}
          className="h-6 md:h-7 w-auto opacity-50 grayscale brightness-200"
          loading="lazy"
        />
      ))}
    </div>
  </div>
);

export default MediaLogos;
