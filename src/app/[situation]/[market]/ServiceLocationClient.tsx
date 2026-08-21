"use client";

import { getMarket, DEFAULT_MARKET } from "@/lib/data/markets";
import { getSituation, DEFAULT_SITUATION } from "@/lib/data/situations";
import { PageProvider } from "@/context/PageContext";
import { useGeneratedContent, mergeContent, BEFORE_AFTER_FIELDS } from "@/hooks/content/useGeneratedContent";
import HeroSection from "@/components/sections/market/HeroSection";
import TickerBar from "@/components/sections/market/TickerBar";
import VideoSection from "@/components/sections/market/VideoSection";
import HowItWorks from "@/components/sections/market/HowItWorks";
import BeforeAfter from "@/components/sections/market/BeforeAfter";
import WhyTarek from "@/components/sections/market/WhyTarek";
import ComparisonTable from "@/components/sections/market/ComparisonTable";
import OfferTransparency from "@/components/sections/market/OfferTransparency";
import ProtectionGuarantee from "@/components/sections/market/ProtectionGuarantee";
import TestimonialCards from "@/components/testimonials/TestimonialCards";
import FAQSection from "@/components/sections/market/FAQSection";
import FinalCTA from "@/components/leads/FinalCTA";
import Footer from "@/components/layout/Footer";
import StickyMobileCTA from "@/components/leads/StickyMobileCTA";
import ExitIntentPopup from "@/components/widgets/ExitIntentPopup";
import SocialProofToast from "@/components/widgets/SocialProofToast";
import CookieConsent from "@/components/widgets/CookieConsent";
import VoiceAgentWidget from "@/components/widgets/VoiceAgentWidget";
import ChatWidget from "@/components/widgets/ChatWidget";
import SEOHead from "@/components/shared/SEOHead";

interface ServiceLocationClientProps {
  situation: string;
  market: string;
}

export default function ServiceLocationClient({ situation, market: marketSlug }: ServiceLocationClientProps) {
  const market = getMarket(marketSlug) || DEFAULT_MARKET;
  const staticSituation = getSituation(situation) || DEFAULT_SITUATION;

  const { data: generated } = useGeneratedContent(market.slug, staticSituation.slug);
  const mergedSituation = mergeContent(staticSituation, generated, BEFORE_AFTER_FIELDS);

  return (
    <PageProvider market={market} situation={mergedSituation}>
      {/*
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:text-sm focus:font-bold"
      >
        Skip to main content
      </a>
      */}
      <div id="main-content" className="min-h-screen bg-background text-foreground">
        <SEOHead />
        <HeroSection />
        <TickerBar />
        <VideoSection />
        <HowItWorks />
        <BeforeAfter />
        <WhyTarek />
        <ComparisonTable />
        <OfferTransparency />
        <ProtectionGuarantee />
        <TestimonialCards location={market.name} />
        <FAQSection />
        <FinalCTA />
        <Footer />
        <StickyMobileCTA />
        <ExitIntentPopup />
        <SocialProofToast />
        <CookieConsent />
        <div className="hidden"><VoiceAgentWidget /></div>
        <ChatWidget />
      </div>
    </PageProvider>
  );
}
