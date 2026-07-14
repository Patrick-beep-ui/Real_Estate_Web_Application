import Image from "next/image";
import { Phone, MessageCircle, Shield, Mail, MapPin } from "lucide-react";

const HERO_BG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/divorce_c5ebfe54.png";
const TOLL_FREE_TEXT = "(949) 295-2842";

const TOLL_FREE_TEXT_E164 = "+19492952842";
const TOLL_FREE_CALL = "(866) 407-3411";
const TOLL_FREE_CALL_E164 = "+18664073411";

export default function AboutHero() {
  return (
    <section className="relative min-h-[500px] md:min-h-[550px] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={HERO_BG}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl">
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">
            About Us
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            We Buy Homes Directly From You —{" "}
            <span className="text-primary">As-Is, For Cash.</span>
          </h1>
          <p className="text-base sm:text-lg leading-relaxed mb-8 text-muted-foreground max-w-2xl">
            Tarek Buys Houses is a family-owned real estate company founded
            by HGTV star Tarek El Moussa. We buy homes in any condition, in
            any situation — no repairs, no fees, no hassle.
          </p>
          <div className="flex flex-wrap gap-4 mb-6">
            <a
              href={`sms:${TOLL_FREE_TEXT_E164}?body=${encodeURIComponent("Hi Tarek, I need to sell my house")}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:brightness-110 transition-all text-lg shadow-amber"
            >
              <MessageCircle className="w-5 h-5" /> Text{" "}
              {TOLL_FREE_TEXT}
            </a>
            <a
              href={`tel:${TOLL_FREE_CALL_E164}`}
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-primary-foreground transition-all text-lg"
            >
              <Phone className="w-5 h-5" /> Call {TOLL_FREE_CALL}
            </a>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
            <Shield className="w-4 h-4" />
            <span>100% Confidential · No Obligation · Free Cash Offer</span>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-5 text-xs text-muted-foreground/70">
            <a
              href="tel:+18664073411"
              className="flex items-center gap-1.5 hover:text-muted-foreground transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-primary/60" />
              (866) 407-3411
            </a>
            <a
              href="mailto:subscriptions@tarekbuyshouses.com"
              className="flex items-center gap-1.5 hover:text-muted-foreground transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-primary/60" />
              subscriptions@tarekbuyshouses.com
            </a>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />
              4411 E La Palma Ave, Anaheim, CA 92807
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
