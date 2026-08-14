"use client";

import { usePageConfig } from "@/context/PageContext";

interface TickerBarCopy {
  items: string[];
}

const TickerBar = ({
  locationName,
  copy: copyOverride = {},
}: {
  locationName?: string;
  copy?: Partial<TickerBarCopy>;
}) => {
  const { market } = usePageConfig();

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
