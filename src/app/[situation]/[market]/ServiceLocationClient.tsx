"use client";

import { getMarket, DEFAULT_MARKET } from "@/lib/data/markets";
import { getSituation, DEFAULT_SITUATION } from "@/lib/data/situations";
import { PageProvider } from "@/context/PageContext";
import { useGeneratedContent, mergeContent } from "@/hooks/content/useGeneratedContent";
import HeroSection from "@/components/HeroSection";
import TickerBar from "@/components/TickerBar";
import VideoSection from "@/components/VideoSection";
import HowItWorks from "@/components/HowItWorks";
import BeforeAfter from "@/components/BeforeAfter";
import WhyTarek from "@/components/WhyTarek";
import ComparisonTable from "@/components/ComparisonTable";
import OfferTransparency from "@/components/OfferTransparency";
import ProtectionGuarantee from "@/components/ProtectionGuarantee";
import TestimonialCards from "@/components/TestimonialCards";
import FAQSection from "@/components/FAQSection";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import StickyMobileCTA from "@/components/StickyMobileCTA";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import SocialProofToast from "@/components/SocialProofToast";
import CookieConsent from "@/components/CookieConsent";
import VoiceAgentWidget from "@/components/VoiceAgentWidget";
import ChatWidget from "@/components/ChatWidget";
import SEOHead from "@/components/SEOHead";

interface ServiceLocationClientProps {
  situation: string;
  market: string;
}

export default function ServiceLocationClient({ situation, market: marketSlug }: ServiceLocationClientProps) {
  const market = getMarket(marketSlug) || DEFAULT_MARKET;
  const staticSituation = getSituation(situation) || DEFAULT_SITUATION;

  const { data: generated } = useGeneratedContent(market.slug, staticSituation.slug);
  const mergedSituation = mergeContent(staticSituation, generated);

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
