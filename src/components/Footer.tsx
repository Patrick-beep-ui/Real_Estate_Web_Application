"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { usePageConfig } from "@/context/PageContext";
import tbhLogo from "@/assets/tbh-logo.png";
import { LICENSE_LINE, MARKETS } from "@/lib/data/markets";

const FEATURED_MARKETS = ["tampa", "phoenix", "atlanta", "dallas", "houston", "charlotte", "nashville", "las-vegas", "denver", "los-angeles"];

const DISCLAIMER = "*The materials and information on this website are for general informational purposes only and do not constitute an offer to sell or a solicitation of an offer to buy any securities, real estate, or investment products. TBH is not a licensed real estate broker or agent and is not a licensed securities broker-dealer or investment advisor. TBH is not offering and is not licensed to offer services as a real estate broker or agent. No content published on this website is intended to form the basis of, or be relied upon in connection with, any contract or financial decision.";

const Footer = () => {
  const pathname = usePathname();
  const { market } = usePageConfig();
  const isHomepage = pathname === "/";

  return (
    <footer className="bg-[hsl(0,0%,7%)] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <a href="/" className="inline-block w-[120px]">
              <Image src={'/images/tbh_logo_white.webp'} alt="Tarek Buys Houses" width={150} height={50} className="h-14 mb-4 -ml[5px]" />
            </a>
            <p className="text-muted-foreground text-sm max-w-sm">
              Tarek Buys Houses is a real estate investment company
              <br />that purchases homes directly from homeowners for cash.
            </p>
            <p className="text-[10px] leading-tight text-muted-foreground/60 mt-3 max-w-sm">
              {DISCLAIMER}
            </p>
            <p className="text-muted-foreground/80 text-xs mt-2">{LICENSE_LINE}</p>
          </div>

          <div>
            {isHomepage ? (
              <>
                <p className="text-foreground font-semibold text-sm mb-3">
                  Nationwide Coverage<sup className="text-[10px]">*</sup> — {Object.keys(MARKETS).length}+ Markets
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-1">
                  {FEATURED_MARKETS.map((slug) => {
                    const m = MARKETS[slug];
                    return m ? (
                      <Link key={slug} href={`/markets/${slug}`} className="text-muted-foreground/80 text-xs hover:text-primary transition-colors">
                        {m.name}, {m.state}
                      </Link>
                    ) : null;
                  })}
                </div>
              </>
            ) : (
              <>
                <p className="text-foreground font-semibold text-sm mb-3">
                  {market.name} Neighborhoods We Serve
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-1">
                  {market.serviceAreas.map((area) => (
                    <span key={area} className="text-muted-foreground/80 text-xs">{area}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground/80 text-xs">
            © {new Date().getFullYear()} Tarek Buys Houses, LLC. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" className="text-muted-foreground/50 shrink-0">
                <path d="M12 2L2 8v2h20V8L12 2zM4 12v8h4v-8H4zm6 0v8h4v-8h-4zm6 0v8h4v-8h-4zM2 22h20v2H2v-2z" fill="currentColor" />
              </svg>
              <span className="text-muted-foreground/80 text-xs">Equal Housing Opportunity</span>
            </div>
            <Link href="/privacy" className="text-muted-foreground/80 text-xs hover:text-muted-foreground">Privacy</Link>
            <Link href="/terms" className="text-muted-foreground/80 text-xs hover:text-muted-foreground">Terms</Link>
            <Link href="/do-not-sell" className="text-muted-foreground/80 text-xs hover:text-muted-foreground">Do Not Sell My Info</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
