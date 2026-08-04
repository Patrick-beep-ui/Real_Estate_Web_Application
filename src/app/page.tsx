"use client";

import { lazy, Suspense } from "react";

import HomeHero from "@/components/sections/homepage/HomeHero";
import MediaLogosStrip from "@/components/sections/homepage/MediaLogosStrip";
import VideoSection from "@/components/sections/market/VideoSection";
import HowItWorks from "@/components/sections/homepage/HowItWorks";
import TestimonialsSpotlight from "@/components/testimonials/TestimonialsSpotlight";
import TestimonialsEditorial from "@/components/testimonials/TestimonialsEditorial";
import MarketsGrid from "@/components/sections/homepage/MarketsGrid";
import BottomCTA from "@/components/leads/BottomCTA";
import ChatWidget from "@/components/widgets/ChatWidget";
import { PHONE, buildTelLink, buildSmsLink } from "@/lib/shared/phone";
const Footer = lazy(() => import("@/components/layout/Footer"));

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
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

      <div className=""><TestimonialsSpotlight /></div>
      <div className="hidden"><TestimonialsEditorial /></div>

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
