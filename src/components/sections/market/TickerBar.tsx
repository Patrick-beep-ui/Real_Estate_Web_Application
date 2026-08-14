"use client";

import { usePageConfig } from "@/context/PageContext";
import type { LandingContent } from "@/lib/landing/data";

const TickerBar = ({ landingSource }: { landingSource?: LandingContent }) => {
  const { market } = usePageConfig();

  const locationName = landingSource?.tickerLocationName;

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
    `Now Buying in ${locationName ?? market.name}`,
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
