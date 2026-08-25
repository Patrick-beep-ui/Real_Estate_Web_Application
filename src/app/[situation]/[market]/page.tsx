import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITUATIONS, getSituation } from "@/lib/data/situations";
import { MARKETS, getMarket } from "@/lib/data/markets";
import { fetchGeneratedContent } from "@/lib/content/server";
import { mergeContent, BEFORE_AFTER_FIELDS } from "@/hooks/content/useGeneratedContent";
import ServiceLocationClient from "./ServiceLocationClient";

export const dynamicParams = false;
export const revalidate = 3600;

function extractCity(marketName: string): string {
  const metroMatch = marketName.match(/^(.+)\s+Metro$/);
  if (metroMatch) return metroMatch[1];
  const hyphenMatch = marketName.match(/^([^-]+)-/);
  if (hyphenMatch) return hyphenMatch[1];
  const bayAreaMatch = marketName.match(/^(.+)\s+Bay Area$/);
  if (bayAreaMatch) return bayAreaMatch[1];
  return marketName;
}

interface PageProps {
  params: Promise<{
    situation: string;
    market: string;
  }>;
}

export async function generateStaticParams() {
  const situations = Object.keys(SITUATIONS);
  const markets = Object.keys(MARKETS);
  
  const params: { situation: string; market: string }[] = [];
  
  for (const situation of situations) {
    for (const market of markets) {
      params.push({ situation, market });
    }
  }
  
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { situation, market } = await params;
  const situationData = getSituation(situation);
  const marketData = getMarket(market);
  
  if (!situationData || !marketData) {
    return {
      title: "Not Found",
    };
  }

  const generated = await fetchGeneratedContent(market, situation);
  const merged = mergeContent(situationData, generated, BEFORE_AFTER_FIELDS);
  
  const hasAiMeta = !!generated?.meta_title;

  let title: string;
  if (hasAiMeta) {
    const section1 = merged.metaTitle.split('|')[0].split(' - ')[0].trim().replaceAll('{market}', marketData.name);
    const city = extractCity(marketData.name);
    const escaped = city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cityRe = new RegExp(`\\b${escaped}\\b`);
    const withMarket = section1.includes(marketData.name)
      ? section1
      : cityRe.test(section1)
        ? section1.replace(cityRe, marketData.name)
        : `${section1} ${marketData.name}`;
    const statePattern = new RegExp(`[,\\s]*${marketData.state}$`);
    title = `${withMarket.replace(statePattern, '')}, ${marketData.state}`;
  } else {
    title = `${merged.metaTitle} in ${marketData.name}, ${marketData.state}`;
  }

  const description = hasAiMeta
    ? merged.metaDescription.replaceAll('{market}', marketData.name)
    : `${merged.metaDescription} Serving ${marketData.name} and surrounding ${marketData.state} areas.`;
  
  return {
    title,
    description,
    alternates: {
      canonical: `https://tarekbuyshouses.com/${situation}/${market}`,
    },
    openGraph: {
      title: `${title} | Tarek Buys Houses`,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Tarek Buys Houses`,
      description,
    },
  };
}

export default async function SituationMarketPage({ params }: PageProps) {
  const { situation, market } = await params;
  
  const situationData = getSituation(situation);
  const marketData = getMarket(market);
  
  if (!situationData || !marketData) {
    notFound();
  }

  const generated = await fetchGeneratedContent(market, situation);
  
  return (
    <ServiceLocationClient
      situation={situation}
      market={market}
      initialGeneratedContent={generated}
    />
  );
}
