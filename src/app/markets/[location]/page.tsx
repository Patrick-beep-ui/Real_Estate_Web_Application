"use client";

import Link from "next/link";
import { MARKETS, MarketConfig } from "@/lib/data/markets";
import { SITUATIONS, SituationConfig } from "@/lib/data/situations";
import { useParams } from "next/navigation";

// Build state groups
const stateGroups: Record<string, MarketConfig[]> = {};
Object.values(MARKETS).forEach((m) => {
  if (!stateGroups[m.stateFullName]) stateGroups[m.stateFullName] = [];
  stateGroups[m.stateFullName].push(m);
});

const sortedStates = Object.keys(stateGroups).sort();
const situations = Object.values(SITUATIONS);

export default function Markets() {
  const { location } = useParams<{ location?: string }>();

  const selectedMarket = location ? MARKETS[location] : null;

  // Filter logic
  const filteredStates = selectedMarket
    ? [selectedMarket.stateFullName]
    : sortedStates;

  const filteredStateGroups = selectedMarket
    ? {
        [selectedMarket.stateFullName]: [selectedMarket],
      }
    : stateGroups;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 pt-24 py-12">
        {/* Dynamic Title */}
        <h1 className="text-4xl md:text-5xl font-bold mb-2">
          {selectedMarket ? (
            <>
              {selectedMarket.name}, {selectedMarket.state}{" "}
              <span className="text-primary">Market</span>
            </>
          ) : (
            <>
              Every Market. Every Situation.{" "}
              <span className="text-primary">One Click.</span>
            </>
          )}
        </h1>

        <p className="text-muted-foreground text-lg mb-12 max-w-2xl">
          {selectedMarket
            ? `Explore all situations available for ${selectedMarket.name}.`
            : `${Object.keys(MARKETS).length * situations.length} hyper-localized landing pages generating leads 24/7 with zero employees.`}
        </p>

        {/* Markets */}
        {filteredStates.map((state) => (
          <section key={state} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-primary">{state}</h2>

            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
              {filteredStateGroups[state].map((market) => (
                <MarketCard
                  key={market.slug}
                  market={market}
                  situations={situations}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

function MarketCard({
  market,
  situations,
}: {
  market: MarketConfig;
  situations: SituationConfig[];
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">
          {market.name}, {market.state}
        </h3>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {market.phone}
      </p>

      <div className="flex flex-wrap gap-2">
        {situations.map((sit) => (
          <Link
            key={sit.slug}
            href={`/${sit.slug}/${market.slug}`}
            className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            {sit.label}
          </Link>
        ))}
      </div>
    </div>
  );
}