import { useEffect, useState } from "react";
import { X, Home } from "lucide-react";
import { usePageConfig } from "@/context/PageContext";

// Market-realistic median price ranges (source: general market data)
const MARKET_PRICE_RANGES: Record<string, [number, number]> = {
  tampa: [180000, 420000],
  phoenix: [250000, 520000],
  atlanta: [170000, 400000],
  dallas: [220000, 480000],
  houston: [180000, 440000],
  charlotte: [200000, 450000],
  nashville: [230000, 500000],
  jacksonville: [170000, 380000],
  orlando: [200000, 430000],
  "san-antonio": [160000, 360000],
  "las-vegas": [240000, 480000],
  denver: [300000, 580000],
  raleigh: [220000, 470000],
  minneapolis: [200000, 430000],
  sacramento: [320000, 560000],
  "salt-lake-city": [280000, 520000],
  tucson: [160000, 340000],
  indianapolis: [140000, 320000],
  columbus: [160000, 350000],
  "san-bernardino": [280000, 500000],
  "los-angeles": [450000, 900000],
  "san-diego": [480000, 850000],
  "orange-county": [550000, 950000],
  "san-francisco": [600000, 1200000],
  "san-jose": [650000, 1300000],
  fresno: [220000, 400000],
  bakersfield: [200000, 370000],
  mesa: [260000, 480000],
  scottsdale: [350000, 700000],
  flagstaff: [300000, 550000],
};

const DEFAULT_RANGE: [number, number] = [180000, 420000];

const TIME_AGO = ["2 weeks ago", "last month", "3 weeks ago", "6 weeks ago", "2 months ago"];

function formatPrice(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  return `$${Math.round(n / 1000)}K`;
}

function generateRealisticPrice(min: number, max: number): string {
  // Round to nearest 5K for realism
  const raw = min + Math.random() * (max - min);
  const rounded = Math.round(raw / 5000) * 5000;
  return formatPrice(rounded);
}

const SocialProofToast = () => {
  const { market } = usePageConfig();
  const [current, setCurrent] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [soldData, setSoldData] = useState<Array<{ area: string; price: string; time: string }>>([]);

  // Generate market-realistic data once on mount
  useEffect(() => {
    const range = MARKET_PRICE_RANGES[market.slug] || DEFAULT_RANGE;
    const areas = market.serviceAreas.length >= 5
      ? market.serviceAreas.slice(0, 5)
      : Array.from({ length: 5 }, (_, i) => market.serviceAreas[i % market.serviceAreas.length] || market.name);

    setSoldData(
      areas.map((area, i) => ({
        area,
        price: generateRealisticPrice(range[0], range[1]),
        time: TIME_AGO[i],
      }))
    );
  }, [market]);

  useEffect(() => {
    if (dismissed || soldData.length === 0) return;
    const initialTimer = setTimeout(() => setCurrent(0), 15000);
    return () => clearTimeout(initialTimer);
  }, [dismissed, soldData.length]);

  useEffect(() => {
    if (current === null || dismissed) return;
    const hideTimer = setTimeout(() => {
      setCurrent(null);
      const nextTimer = setTimeout(() => {
        setCurrent((prev) => ((prev ?? 0) + 1) % soldData.length);
      }, 30000);
      return () => clearTimeout(nextTimer);
    }, 5000);
    return () => clearTimeout(hideTimer);
  }, [current, dismissed, soldData.length]);

  if (current === null || dismissed || soldData.length === 0) return null;

  const data = soldData[current];

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 z-40 animate-in slide-in-from-bottom-4 duration-300 max-w-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Home className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-sm font-medium">
            A home in <span className="font-semibold">{data.area}</span> sold for
          </p>
          <p className="text-primary font-bold text-base">{data.price}</p>
          <p className="text-muted-foreground text-[10px] mt-0.5">
            {data.time} · {market.name} area
          </p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SocialProofToast;
