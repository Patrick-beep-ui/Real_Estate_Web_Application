"use client";

import { lazy, Suspense } from "react";

import HomeHero from "@/components/sections/homepage/HomeHero";
import VideoSection from "@/components/sections/market/VideoSection";
import HowItWorksInteractivePreview from "@/components/HowItWorksInteractivePreview";
import HowItWorksEditorialAccordion from "@/components/HowItWorksEditorialAccordion";
import HowItWorksConnectedTimeline from "@/components/HowItWorksConnectedTimeline";
import MarketsGrid from "@/components/sections/homepage/MarketsGrid";
import HowItWorks from "@/components/sections/homepage/HowItWorks";
import MediaLogosStrip from "@/components/sections/homepage/MediaLogosStrip";
import BottomCTA from "@/components/leads/BottomCTA";
import ChatWidget from "@/components/widgets/ChatWidget";
import TestimonialsSpotlight from "@/components/testimonials/TestimonialsSpotlight";
import TestimonialsFeatured from "@/components/testimonials/TestimonialsFeatured";
import TestimonialsEditorial from "@/components/testimonials/TestimonialsEditorial";
import { PHONE, buildTelLink, buildSmsLink } from "@/lib/shared/phone";
const Footer = lazy(() => import("@/components/layout/Footer"));

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <HomeHero />

      <MediaLogosStrip />

      <VideoSection
        heading="Watch Before You Call"
        subtitle="60 seconds. This is exactly how we help homeowners like you."
        phone={PHONE.call}
        text={PHONE.text}
        smsLink={buildSmsLink()}
        telLink={buildTelLink()}
        showWhyTarek={false}
      />

      <HowItWorks />

      {/* --- REDESIGN CONCEPTS  */}
        <HowItWorksInteractivePreview />

        {/*HowItWorksEditorialAccordion */}

        {/*<HowItWorksConnectedTimeline />*/}
    

      {/* --- END REDESIGN CONCEPTS --- */}
      <div className=""><TestimonialsSpotlight /></div>
      <hr className=""/>
      <div className=""><TestimonialsFeatured /></div>
      <hr className=""/>
      <div className=""><TestimonialsEditorial /></div>

      <hr />

      <MarketsGrid />

      <BottomCTA />

      <Suspense fallback={null}>
        <Footer />
      </Suspense>

      <ChatWidget />
    </div>
  );
}
