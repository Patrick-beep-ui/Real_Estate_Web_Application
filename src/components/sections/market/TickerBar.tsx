import { usePageConfig } from "@/context/PageContext";

const TickerBar = () => {
  const { market } = usePageConfig();

  const TICKER_ITEMS = [
    `${market.stats.homesClosed} Homes Purchased Nationwide`,
    "·",
    "7-Day Close",
    "·",
    "$0 Fees",
    "·",
    `${market.stats.bbbRating} BBB Rated`,
    "·",
    `${market.stats.googleRating}★ Google`,
    "·",
    `Now Buying in ${market.name}`,
  ];

  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="bg-primary overflow-hidden py-3">
      <div className="ticker-scroll flex whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="mx-6 text-sm font-semibold text-primary-foreground">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TickerBar;
