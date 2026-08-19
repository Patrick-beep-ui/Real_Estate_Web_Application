"use client";

import { usePageConfig } from "@/context/PageContext";
import type { LandingContent } from "@/lib/landing/data";

export interface TickerBarCopy {
  items: string[];
}

const TickerBar = ({
  landingSource,
  copy: copyOverride = {},
}: {
  landingSource?: LandingContent;
  copy?: Partial<TickerBarCopy>;
}) => {
  const { market } = usePageConfig();

  const locationName = landingSource?.tickerLocationName;

  const copy = {
    items: copyOverride.items ?? [
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
    ],
  };

  const items = [...copy.items, ...copy.items];

  const GOOGLE_REVIEWS_URL =
    "https://www.google.com/search?q=Tarek+Buys+Houses+reviews#lrd=0x80dcd13741377699:0x12c1caa3fc0160d4,1,,,,";

  return (
    <a
      href={GOOGLE_REVIEWS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-primary overflow-hidden py-3 cursor-pointer hover:opacity-90 transition-opacity"
    >
      <div className="ticker-scroll flex whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="mx-6 text-sm font-semibold text-primary-foreground">
            {item}
          </span>
        ))}
      </div>
    </a>
  );
};

export default TickerBar;
