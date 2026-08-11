import HomeHero from "@/components/sections/homepage/HomeHero";
import StickyMobileCTA from "@/components/leads/StickyMobileCTA";
import TickerBar from "@/components/sections/market/TickerBar";
import HowItWorks from "@/components/sections/market/HowItWorks";

export default function CaliforniaPage() {
    return (
        <>
            <HomeHero
                source="california-landing"
                locationLine="Now Buying Homes Across California"
                marketSlug="california"
            />
            <TickerBar locationName="California" />
            <HowItWorks locationName="California" />

            <StickyMobileCTA marketSlug="california" situationSlug="landing-california" />
        </>
    )
}