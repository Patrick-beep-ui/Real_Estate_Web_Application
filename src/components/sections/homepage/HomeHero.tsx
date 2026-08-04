"use client";

import Image from "next/image";
import { MapPin, Phone, MessageCircle, CheckCircle, Shield, Star } from "lucide-react";
import { useGeoMarket } from "@/hooks/geo/useGeoMarket";
import tarekHeadshot from "@/assets/tarek-headshot.png";
import HomeLeadForm from "@/components/leads/HomeLeadForm";
import PhoneLink from "@/components/shared/PhoneLink";
import { PHONE, buildTelLink, buildSmsLink } from "@/lib/shared/phone";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/divorce_c5ebfe54.png";

const HomeHero = () => {
  const geo = useGeoMarket();
  const detectedMarket = geo.market;

  return (
    <section className="relative min-h-[600px] md:min-h-[700px] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <Image 
          src={HERO_BG} 
          alt="" 
          fill 
          className="object-cover" 
          priority 
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/80 to-black/50" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-5 gap-10 items-center">
          <div className="lg:col-span-3">
            <div className="flex items-center gap-3 mb-6">
              <Image src={tarekHeadshot} alt="Tarek El Moussa" width={50} height={50} className="w-[50px] h-[50px] rounded-full object-cover border-2 border-primary/70 shadow-[0_0_8px_2px_hsl(38_92%_50%/0.30)] brightness-110" />
              <span className="text-sm text-muted-foreground">Tarek El Moussa · As Seen on HGTV</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Sell Your Home Fast<br />
              <span className="text-primary">For Cash. Any Condition.</span>
            </h1>

            {detectedMarket && !geo.loading && (
              <p className="text-sm font-semibold text-primary mb-4 flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Serving {detectedMarket.name}, {detectedMarket.state} & Surrounding Areas
              </p>
            )}

            <p className="text-base sm:text-lg leading-relaxed mb-8 text-muted-foreground max-w-xl">
              Skip the hassle of listings, repairs, and months of waiting. Get a fair cash offer from Tarek's team within 24 hours — close on your timeline.
            </p>

            <ul className="space-y-3 mb-8">
              {["No repairs needed — we buy as-is", "Close in as few as 7 days", "Zero fees, zero commissions", "1,000+ homes purchased nationwide"].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-4 mb-6">
              <PhoneLink href={buildSmsLink()} className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:brightness-125 transition-all text-lg shadow-amber">
                <MessageCircle className="w-5 h-5" /> Text {PHONE.text}
              </PhoneLink>
              <PhoneLink href={buildTelLink()} className="inline-flex items-center gap-2 px-8 py-4 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-primary-foreground transition-all text-lg">
                <Phone className="w-5 h-5" /> Call {PHONE.call}
              </PhoneLink>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Shield className="w-4 h-4" />
              <span>100% Confidential · No Obligation · Free Cash Offer</span>
            </div>
            <p className="text-xs text-muted-foreground/60 mb-4">All transactions handled by a licensed third-party title company.</p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <a href="https://www.google.com/search?q=Tarek+Buys+Houses+reviews#lrd=0x80dcd13741377699:0x12c1caa3fc0160d4,1,,,," target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                <Star className="w-4 h-4 text-primary fill-primary" />
                <span className="text-primary font-semibold">4.7 Google</span>
              </a>
              <span>·</span>
              <a href="https://listwithclever.com/cash-home-buyers/reviews/tarek-buys-houses/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">A+ BBB</a>
              <span>·</span>
              <span>1,000+ Homes Purchased</span>
              <span>·</span>
              <span>As Seen on HGTV</span>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div id="about-cta" className="bg-card/90 backdrop-blur-md border border-border rounded-2xl p-6 shadow-2xl">
              <HomeLeadForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
