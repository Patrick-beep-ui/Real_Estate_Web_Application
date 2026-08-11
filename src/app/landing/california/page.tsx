import HomeHero from "@/components/sections/homepage/HomeHero";
import StickyMobileCTA from "@/components/leads/StickyMobileCTA";

export default function CaliforniaPage() {
    return (
        <>
            <HomeHero
                source="california-landing"
                locationLine="Now Buying Homes Across California"
                marketSlug="california"
            />
            <StickyMobileCTA marketSlug="california" situationSlug="landing-california" />
        </>
    )
}