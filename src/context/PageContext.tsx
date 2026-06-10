import { createContext, useContext, ReactNode } from "react";
import { MarketConfig, DEFAULT_MARKET } from "@/lib/data/markets";
import { SituationConfig, DEFAULT_SITUATION } from "@/lib/data/situations";

export interface PageConfig {
  market: MarketConfig;
  situation: SituationConfig;
  phone: string;
  phoneE164: string;
  text: string;
  textE164: string;
  smsLink: string;
  telLink: string;
}

function buildPageConfig(market: MarketConfig, situation: SituationConfig): PageConfig {
  const smsBody = encodeURIComponent(situation.smsPrefilledText);
  return {
    market,
    situation,
    phone: market.phone,
    phoneE164: market.phoneE164,
    text: market.text,
    textE164: market.textE164,
    smsLink: `sms:${market.textE164}?body=${smsBody}`,
    telLink: `tel:${market.phoneE164}`,
  };
}

const PageContext = createContext<PageConfig>(
  buildPageConfig(DEFAULT_MARKET, DEFAULT_SITUATION)
);

export function usePageConfig() {
  return useContext(PageContext);
}

export function PageProvider({
  market,
  situation,
  children,
}: {
  market: MarketConfig;
  situation: SituationConfig;
  children: ReactNode;
}) {
  const config = buildPageConfig(market, situation);
  return <PageContext.Provider value={config}>{children}</PageContext.Provider>;
}
