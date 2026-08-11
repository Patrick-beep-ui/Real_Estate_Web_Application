import HomeHero from "@/components/sections/homepage/HomeHero";
import StickyMobileCTA from "@/components/leads/StickyMobileCTA";
import TickerBar from "@/components/sections/market/TickerBar";
import HowItWorks from "@/components/sections/market/HowItWorks";
import VideoSection from "@/components/sections/market/VideoSection";
import { getLanding } from "@/lib/landing/data";

export default function CaliforniaPage() {
    const california = getLanding("california");

    return (
        <>
            <HomeHero
                source={california.source}
                locationLine={california.hero.locationLine}
                marketSlug={california.marketSlug}
                situationSlug={california.situationSlug}
            />
            <TickerBar locationName={california.tickerLocationName} />
            <VideoSection
                heading={california.video.heading}
                subtitle={california.video.subtitle}
                bodyParagraphs={california.video.bodyParagraphs}
            />

            <HowItWorks locationName={california.howItWorksLocationName} />

            <StickyMobileCTA
                marketSlug={california.marketSlug}
                situationSlug={california.situationSlug}
            />
        </>
    )
}