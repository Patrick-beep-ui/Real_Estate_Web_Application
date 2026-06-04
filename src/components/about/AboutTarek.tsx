import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function AboutTarek() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div className="relative">
            <Image
              src="/images/tarek-portrait.webp"
              alt="Tarek El Moussa — HGTV Host and Real Estate Investor"
              width={512}
              height={640}
              className="w-full max-w-md mx-auto rounded-2xl shadow-2xl"
            />
            <div className="absolute -bottom-4 -right-4 bg-primary/20 backdrop-blur-md border border-primary/30 text-primary px-5 py-3 rounded-xl font-bold shadow-lg text-sm">
              20+ Years Experience
            </div>
          </div>

          <div>
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">
              Meet the Founder
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6">
              Tarek El Moussa
            </h2>
            <p className="text-lg md:text-xl text-primary font-semibold mb-4">
              HGTV Host &bull; Real Estate Investor &bull; Author
            </p>
            <div className="space-y-4 text-muted-foreground leading-relaxed mb-8">
              <p className="text-base md:text-lg">
                You might know me from HGTV&rsquo;s <em>Flip or Flop</em>, but
                what you might not know is that I&rsquo;ve been buying houses
                for cash for over two decades. I&rsquo;ve seen every situation
                imaginable — foreclosures, divorces, inherited properties, homes
                that need major work — and I&rsquo;ve helped over 1,200 families
                find a way forward.
              </p>
              <p className="text-base md:text-lg">
                That&rsquo;s why I started Tarek Buys Houses. Not everyone wants
                to list their home, wait months for a buyer, or deal with
                repairs and showings. Sometimes you just need a fair offer and a
                fast close. That&rsquo;s what we do.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/#get-offer"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:brightness-110 transition-all text-base shadow-amber"
              >
                Get Your Cash Offer
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="https://www.instagram.com/therealtarekelmoussa"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-primary-foreground transition-all text-base"
              >
                Follow on Instagram
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
