import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITUATIONS, getSituation } from "@/lib/data/situations";
import { MARKETS, getMarket } from "@/lib/data/markets";
import { fetchGeneratedContent } from "@/lib/content/server";
import { mergeContent, BEFORE_AFTER_FIELDS } from "@/hooks/content/useGeneratedContent";
import ServiceLocationClient from "./ServiceLocationClient";

export const dynamicParams = false;
export const revalidate = 3600;

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
    const section1 = merged.metaTitle.split('|')[0].trim().replaceAll('{market}', marketData.name);
    const withMarket = section1.includes(marketData.name)
      ? section1
      : `${section1} ${marketData.name}`;
    title = `${withMarket}, ${marketData.state}`;
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
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
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
