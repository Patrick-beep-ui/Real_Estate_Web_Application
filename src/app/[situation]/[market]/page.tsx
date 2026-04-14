import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITUATIONS, getSituation } from "@/lib/data/situations";
import { MARKETS, getMarket } from "@/lib/data/markets";
import ServiceLocationClient from "./ServiceLocationClient";

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
  
  const title = situationData.metaTitle
    ? situationData.metaTitle.replace(/{market}/g, marketData.name)
    : `${situationData.label} - ${marketData.name} | Tarek Buys Houses`;
  const description = situationData.metaDescription
    ? situationData.metaDescription.replace(/{market}/g, marketData.name)
    : `Sell your house in ${marketData.name} during ${situationData.label.toLowerCase()}. Get a fair cash offer from Tarek El Moussa's team. Close in as little as 7 days.`;
  
  return {
    title,
    description,
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
  
  return (
    <ServiceLocationClient
      situation={situation}
      market={market}
    />
  );
}
