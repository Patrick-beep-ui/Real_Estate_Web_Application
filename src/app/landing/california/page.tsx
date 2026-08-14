import { lazy, Suspense } from "react";
import HomeHero from "@/components/sections/homepage/HomeHero";
import StickyMobileCTA from "@/components/leads/StickyMobileCTA";
import TickerBar from "@/components/sections/market/TickerBar";
import HowItWorks from "@/components/sections/market/HowItWorks";
import VideoSection from "@/components/sections/market/VideoSection";
import BeforeAfter from "@/components/sections/market/BeforeAfter";
import WhyTarek from "@/components/sections/market/WhyTarek";
import ComparisonTable from "@/components/sections/market/ComparisonTable";
import OfferTransparency from "@/components/sections/market/OfferTransparency";
import ProtectionGuarantee from "@/components/sections/market/ProtectionGuarantee";
import TestimonialCards from "@/components/testimonials/TestimonialCards";
import FAQSection from "@/components/sections/market/FAQSection";
import FinalCTA from "@/components/leads/FinalCTA";
import CookieConsent from "@/components/widgets/CookieConsent";
import LandingAnalyticsInit from "@/components/widgets/LandingAnalyticsInit";
import { getLanding } from "@/lib/landing/data";
const Footer = lazy(() => import("@/components/layout/Footer"));

export default function CaliforniaPage() {
    const california = getLanding("california");

    return (
        <>
            <HomeHero landingSource={california} />
            <TickerBar landingSource={california} />
            <VideoSection
                heading={california.video.heading}
                subtitle={california.video.subtitle}
                bodyParagraphs={california.video.bodyParagraphs}
                ctaLabel={california.ctaLabel}
            />

            <HowItWorks locationName={california.howItWorksLocationName} />

            <BeforeAfter {...california.beforeAfter} />

            <WhyTarek
                bodyParagraphs={california.whyTarek.bodyParagraphs}
                urgencyLine={california.whyTarek.urgencyLine}
            />

            <ComparisonTable />

            <OfferTransparency />

            <ProtectionGuarantee />

            <TestimonialCards
                location="California"
                ctaLabel={california.ctaLabel}
                showWritten={false}
            />

            <FAQSection faqs={california.faqs} />

            <FinalCTA
                source={california.source}
                marketSlug={california.marketSlug}
                situationSlug={california.situationSlug}
                {...california.finalCta}
            />

            <StickyMobileCTA
                marketSlug={california.marketSlug}
                situationSlug={california.situationSlug}
                revealOnScroll
            />

            <Suspense fallback={null}>
                <Footer homepage />
            </Suspense>

            <CookieConsent />
            <LandingAnalyticsInit />
        </>
    )
}