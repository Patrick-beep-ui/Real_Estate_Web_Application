"use client";

import { lazy, Suspense } from "react";
import { PageProvider } from "@/context/PageContext";
import { DEFAULT_MARKET } from "@/lib/data/markets";
import { DEFAULT_SITUATION } from "@/lib/data/situations";
import AboutHero from "@/components/about/AboutHero";
import AboutStats from "@/components/about/AboutStats";
// import AboutStory from "@/components/about/AboutStory"; // preserved — not currently rendered
import AboutStoryV2 from "@/components/about/AboutStoryV2";
import AboutShows from "@/components/about/AboutShows";
import AboutValues from "@/components/about/AboutValues";
import MediaLogos from "@/components/MediaLogos";
import AboutMediaLogos from "@/components/about/AboutMediaLogos";
import HowItWorks from "@/components/sections/market/HowItWorks";
import AboutTarek from "@/components/about/AboutTarek";
import WhyTarek from "@/components/sections/market/WhyTarek";
// import ProtectionGuarantee from "@/components/sections/market/ProtectionGuarantee"; // preserved — not currently rendered
import AboutProtectionGuarantee from "@/components/about/AboutProtectionGuarantee";
import TestimonialCards from "@/components/TestimonialCards";
import TestimonialsFeatured from "@/components/TestimonialsFeatured";
import TestimonialsEditorial from "@/components/TestimonialsEditorial";
import FinalCTA from "@/components/leads/FinalCTA";
import ExitIntentPopup from "@/components/widgets/ExitIntentPopup";
import ChatWidget from "@/components/widgets/ChatWidget";
const Footer = lazy(() => import("@/components/layout/Footer"));

export default function AboutPage() {
  return (
    <PageProvider market={DEFAULT_MARKET} situation={DEFAULT_SITUATION}>
      <div className="min-h-screen bg-background text-foreground">
        <AboutHero />
        <AboutMediaLogos />
        <AboutTarek /> 
        <div className="hidden"><AboutStats /></div>
        <AboutShows />
        <AboutStoryV2 />
        <AboutValues />
        <HowItWorks />

        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <TestimonialCards location={DEFAULT_MARKET.name} />
          </div>
        </section>

        <AboutProtectionGuarantee />

        <Suspense fallback={null}>
          <Footer />
        </Suspense>

        <ChatWidget />
      </div>
    </PageProvider>
  );
}
