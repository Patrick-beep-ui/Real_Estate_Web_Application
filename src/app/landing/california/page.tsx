import HomeHero from "@/components/sections/homepage/HomeHero";
import StickyMobileCTA from "@/components/leads/StickyMobileCTA";
import TickerBar from "@/components/sections/market/TickerBar";

export default function CaliforniaPage() {
    return (
        <>
            <HomeHero
                source="california-landing"
                locationLine="Now Buying Homes Across California"
                marketSlug="california"
            />
            <TickerBar locationName="California" />

            <StickyMobileCTA marketSlug="california" situationSlug="landing-california" />
        </>
    )
}