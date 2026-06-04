"use client";

import { lazy, Suspense } from "react";
import { PageProvider } from "@/context/PageContext";
import { DEFAULT_MARKET } from "@/lib/data/markets";
import { DEFAULT_SITUATION } from "@/lib/data/situations";
import AboutHero from "@/components/about/AboutHero";
import AboutStats from "@/components/about/AboutStats";
import AboutStory from "@/components/about/AboutStory";
import AboutValues from "@/components/about/AboutValues";
import MediaLogos from "@/components/MediaLogos";
import AboutMediaLogos from "@/components/about/AboutMediaLogos";
import HowItWorks from "@/components/HowItWorks";
import AboutTarek from "@/components/about/AboutTarek";
import WhyTarek from "@/components/WhyTarek";
import ProtectionGuarantee from "@/components/ProtectionGuarantee";
import TestimonialCards from "@/components/TestimonialCards";
import FinalCTA from "@/components/FinalCTA";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import ChatWidget from "@/components/ChatWidget";
const Footer = lazy(() => import("@/components/Footer"));

export default function AboutPage() {
  return (
    <PageProvider market={DEFAULT_MARKET} situation={DEFAULT_SITUATION}>
      <div className="min-h-screen bg-background text-foreground">
        <AboutHero />
        <AboutMediaLogos />
        <AboutStory />
        <AboutValues />
        <HowItWorks />
        <AboutTarek />  
        <ProtectionGuarantee />
    

        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <TestimonialCards location={DEFAULT_MARKET.name} />
          </div>
        </section>

        <FinalCTA />

        <ExitIntentPopup />

        <Suspense fallback={null}>
          <Footer />
        </Suspense>

        <ChatWidget />
      </div>
    </PageProvider>
  );
}
