"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, ChevronDown } from "lucide-react";
import { useGeoMarket } from "@/hooks/geo/useGeoMarket";
import { MARKETS } from "@/lib/data/markets";

const FEATURED_MARKETS = ["tampa", "phoenix", "atlanta", "dallas", "houston", "charlotte", "nashville", "las-vegas", "denver", "los-angeles", "san-diego", "orlando"];

const MarketsGrid = () => {
  const geo = useGeoMarket();
  const [showAllMarkets, setShowAllMarkets] = useState(false);

  const detectedMarket = geo.market;
  const allMarketKeys = Object.keys(MARKETS);
  const sortedFeatured = detectedMarket
    ? [detectedMarket.slug, ...FEATURED_MARKETS.filter(s => s !== detectedMarket.slug)]
    : FEATURED_MARKETS;
  const sortedAll = detectedMarket
    ? [detectedMarket.slug, ...allMarketKeys.filter(s => s !== detectedMarket.slug)]
    : allMarketKeys;
  const visibleMarkets = showAllMarkets ? sortedAll : sortedFeatured;

  return (
    <section className="py-20 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-4">We Buy Homes in {allMarketKeys.length}+ Markets</h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Nationwide coverage — find your local team.
          {detectedMarket && <span className="text-primary font-semibold"> We detected you're near {detectedMarket.name}!</span>}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {visibleMarkets.map((slug) => {
            const m = MARKETS[slug];
            if (!m) return null;
            const isDetected = detectedMarket?.slug === slug;
            return (
              <Link
                key={slug}
                href={`/markets/${slug}`}
                className={`group bg-card border rounded-xl p-4 hover:border-primary hover:shadow-[0_0_8px_1px_hsl(38_92%_50%/0.3)] transition-all ${isDetected ? "border-primary ring-1 ring-primary/30" : "border-border"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className={`w-4 h-4 ${isDetected ? "text-primary" : "text-muted-foreground"} group-hover:text-primary transition-colors`} />
                  <span className="font-semibold text-sm">{m.name}</span>
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">{m.state}</span>
                {isDetected && <span className="ml-2 text-xs text-primary font-semibold">📍 Near you</span>}
              </Link>
            );
          })}
        </div>
        {!showAllMarkets && allMarketKeys.length > FEATURED_MARKETS.length && (
          <div className="text-center mt-8">
            <button onClick={() => setShowAllMarkets(true)} className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
              Show all {allMarketKeys.length} markets <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default MarketsGrid;
