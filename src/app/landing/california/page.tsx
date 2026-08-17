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
            <HomeHero landingSource={california} copy={california.heroCopy} />
            <TickerBar landingSource={california} copy={california.tickerCopy} />
            <VideoSection landingSource={california} />

            <HowItWorks landingSource={california} copy={california.howItWorksCopy} />

            <BeforeAfter landingSource={california} />

            <WhyTarek landingSource={california} />

            <ComparisonTable copy={california.comparisonCopy} />

            <OfferTransparency copy={california.offerTransparencyCopy} />

            <ProtectionGuarantee copy={california.protectionGuaranteeCopy} />

            <TestimonialCards
                location="California"
                showWritten={false}
                landingSource={california}
                copy={california.testimonialCopy}
            />

            <FAQSection landingSource={california} />

            <FinalCTA landingSource={california} />

            <StickyMobileCTA
                landingSource={california}
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