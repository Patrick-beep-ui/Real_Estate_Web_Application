"use client";

declare global {
  interface Window {
    grecaptcha: {
      ready(callback: () => void): void;
      execute(siteKey: string, options: { action: string }): Promise<string>;
    };
  }
}

import { useState, lazy, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, MessageCircle, CheckCircle, Shield, Star, ChevronDown, Send, DollarSign } from "lucide-react";
import { useGeoMarket } from "@/hooks/useGeoMarket";
import { MARKETS } from "@/lib/data/markets";
import { MEDIA_LOGOS } from "@/data/mediaLogos";
import { submitLead } from "@/lib/leads";
import { validatePhone, validateEmail, stripPhone, formatPhoneDisplay, formatPriceDisplay } from "@/lib/leads/helpers";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { toast } from "sonner";
import tarekHeadshot from "@/assets/tarek-headshot.png";
import AddressAutocomplete from "@/components/AddressAutocomplete";

import VideoSection from "@/components/VideoSection";
import ChatWidget from "@/components/ChatWidget";
import HowItWorksInteractivePreview from "@/components/HowItWorksInteractivePreview";
import HowItWorksEditorialAccordion from "@/components/HowItWorksEditorialAccordion";
import HowItWorksConnectedTimeline from "@/components/HowItWorksConnectedTimeline";
const Footer = lazy(() => import("@/components/Footer"));

//const TOLL_FREE = "(866) 419-4117";
//const TOLL_FREE_E164 = "+18664194117";

const TOLL_FREE_TEXT = "(949) 295-2842";
const TOLL_FREE_TEXT_E164 = "+19492952842";

const TOLL_FREE_CALL = "(866) 407-3411";
const TOLL_FREE_CALL_E164 = "+18664073411";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663346150678/o6ns5kBVgega3ii8VksF5H/divorce_c5ebfe54.png";

const FEATURED_MARKETS = ["tampa", "phoenix", "atlanta", "dallas", "houston", "charlotte", "nashville", "las-vegas", "denver", "los-angeles", "san-diego", "orlando"];

export default function HomePage() {
  const geo = useGeoMarket();
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [timelineToSell, setTimelineToSell] = useState("");
  const [listedWithAgent, setListedWithAgent] = useState("");
  const [propertyAge, setPropertyAge] = useState("");
  const [marketPrice, setMarketPrice] = useState("");
  const [lowestPrice, setLowestPrice] = useState("");
  const [consentTransactional, setConsentTransactional] = useState(false);
  const [consentPromotional, setConsentPromotional] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [step, setStep] = useState(1);
  const [showAllMarkets, setShowAllMarkets] = useState(false);

  const canAdvanceFromStep1 = address.trim().length > 0;
  const canAdvanceFromStep2 = name.trim().length > 0 && phone.trim().length > 0;

  const detectedMarket = geo.market;
  const allMarketKeys = Object.keys(MARKETS);
  const visibleMarkets = showAllMarkets ? allMarketKeys : FEATURED_MARKETS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || !name || !phone) return;

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      toast.error("Name must be 2-100 characters");
      return;
    }

    if (!validatePhone(phone)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (email && !validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!timelineToSell || !listedWithAgent || !propertyAge) {
      toast.error("Please answer all property details questions");
      return;
    }

    if (!marketPrice || Number(marketPrice) <= 0) {
      toast.error("Please enter an estimated market value");
      return;
    }

    if (!lowestPrice || Number(lowestPrice) <= 0) {
      toast.error("Please enter the lowest price you'd accept");
      return;
    }

    if (Number(lowestPrice) > Number(marketPrice)) {
      toast.error("Lowest price cannot exceed estimated market value");
      return;
    }

    setLoading(true);
    const marketSlug = detectedMarket?.slug || "national";
    try {
      const recaptchaToken = await getRecaptchaToken("submit_lead");
      await submitLead(
        {
          name,
          phone: stripPhone(phone),
          email: email || undefined,
          property_address: address,
          listed_with_agent: listedWithAgent || undefined,
          property_age: propertyAge || undefined,
          timeline_to_sell: timelineToSell || undefined,
          market_price: Number(marketPrice),
          lowest_price: Number(lowestPrice),
          market_slug: marketSlug,
          situation_slug: "home",
          source: "homepage",
          page_path: window.location.pathname,
          consent_transactional: consentTransactional,
          consent_promotional: consentPromotional,
        },
        recaptchaToken,
        idempotencyKey
      );
      setFormSubmitted(true);
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({ 'event': 'form_submitted' });
    } catch {
      toast.error("Something went wrong. Please call us directly.");
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    if (formSubmitted) {
      return (
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">We'll Call You Soon!</h3>
          <p className="text-sm text-muted-foreground">
            A member of Tarek's team will reach out within minutes.
            {email && " A welcome email is on the way."}
          </p>
        </div>
      );
    }

    const stepIndicator = () => (
      <div className="flex items-center justify-center gap-1 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                s <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {s}
            </div>
            {s < 3 && <div className={`w-6 h-0.5 transition-colors ${s <= step ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>
    );

    const consentSection = () => (
      <div className="space-y-3 mt-6 mb-6">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider">SMS Consent</p>
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="consent-transactional-home"
            checked={consentTransactional}
            onChange={(e) => setConsentTransactional(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border shrink-0"
            required
          />
          <label htmlFor="consent-transactional-home" className="text-[10px] leading-[14px] text-muted-foreground">
            I consent to receive non-marketing text messages from Tarek Buys Houses, LLC about appointment confirmations and property follow-up communications. Message frequency may vary. Message &amp; data rates may apply. Text HELP for assistance, reply STOP to opt out.
          </label>
        </div>
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="consent-promotional-home"
            checked={consentPromotional}
            onChange={(e) => setConsentPromotional(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border shrink-0"
          />
          <label htmlFor="consent-promotional-home" className="text-[10px] leading-[14px] text-muted-foreground">
            I consent to receive marketing text messages, about special offers, new listings, and market updates, from Tarek Buys Houses, LLC at the phone number provided. Message frequency may vary. Message &amp; data rates may apply. Text HELP for assistance, reply STOP to opt out.
          </label>
        </div>
        <p className="text-[10px] leading-[14px] text-muted-foreground">(SMS checkboxes are optional — you can still receive your cash offer without selecting any of the above)</p>
        <div className="flex items-start gap-2 mt-6">
          <input type="checkbox" id="privacy-terms-sticky" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border shrink-0" required />
          <label htmlFor="privacy-terms-sticky" className="text-[9px] sm:text-[10px] leading-[13px] sm:leading-[14px] text-muted-foreground">
            I agree to the <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a> and <a href="/terms" className="underline hover:text-foreground">Terms of Service</a>. I acknowledge that my mobile opt-in information and SMS consent will not be shared with third parties or affiliates for marketing or promotional purposes.
          </label>
        </div>
      </div>
    );

    return (
      <>
        <h3 className="text-lg font-bold text-foreground mb-1">Get Your Free Cash Offer</h3>
        <p className="text-sm text-muted-foreground mb-5">Enter your address and info to get started.</p>
        {stepIndicator()}
        <form onSubmit={handleSubmit} className="space-y-3">
          {step === 1 && (
            <>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Property Address</p>
              <AddressAutocomplete
                id="home-address"
                value={address}
                onChange={setAddress}
                className="w-full h-14 text-base rounded-xl bg-secondary border border-border pl-12 pr-4 text-foreground placeholder:text-muted-foreground"
                required
                autoFocus
              />
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!canAdvanceFromStep1}
                  className="px-6 py-3 text-sm font-bold rounded-xl bg-primary hover:brightness-110 text-primary-foreground transition-all disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Your Information</p>
              <label htmlFor="home-name" className="sr-only">Your first name</label>
              <input id="home-name" type="text" placeholder="Your first name" value={name} onChange={(e) => setName(e.target.value)} className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground" required />
              <label htmlFor="home-phone" className="sr-only">Your phone number</label>
              <input id="home-phone" type="tel" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(formatPhoneDisplay(e.target.value))} className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground" required />
              <div>
                <label htmlFor="home-email" className="sr-only">Email (optional)</label>
                <input
                  id="home-email"
                  type="email"
                  placeholder="Email (optional — for offer updates)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 text-sm font-bold rounded-xl border border-border text-foreground hover:bg-secondary transition-all"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!canAdvanceFromStep2}
                  className="px-6 py-3 text-sm font-bold rounded-xl bg-primary hover:brightness-110 text-primary-foreground transition-all disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Property Details</p>
              <select
                id="home-timeline"
                value={timelineToSell}
                onChange={(e) => setTimelineToSell(e.target.value)}
                className={`w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 ${!timelineToSell ? "text-muted-foreground" : "text-foreground"}`}
              >
                <option value="">How soon are you looking to sell?</option>
                <option value="ASAP (within 30 days)">ASAP (within 30 days)</option>
                <option value="1–3 months">1–3 months</option>
                <option value="3–6 months">3–6 months</option>
                <option value="6-12 months">6-12 months</option>
                <option value="Just exploring my options">Just exploring my options</option>
              </select>
              <select
                id="home-listed"
                value={listedWithAgent}
                onChange={(e) => setListedWithAgent(e.target.value)}
                className={`w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 ${!listedWithAgent ? "text-muted-foreground" : "text-foreground"}`}
              >
                <option value="">Is the property currently listed with a real estate agent?</option>
                <option value="Listed">Listed</option>
                <option value="Unlisted">Unlisted</option>
              </select>
              <select
                id="home-age"
                value={propertyAge}
                onChange={(e) => setPropertyAge(e.target.value)}
                className={`w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 ${!propertyAge ? "text-muted-foreground" : "text-foreground"}`}
              >
                <option value="">About how old is the home?</option>
                <option value="20+ Years Old">20+ Years Old</option>
                <option value="10-19 Years Old">10-19 Years Old</option>
                <option value="5 to 9 Years Old">5 to 9 Years Old</option>
                <option value="3-4 Years Old">3-4 Years Old</option>
                <option value="1-2 Years Old">1-2 Years Old</option>
              </select>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 text-sm font-bold rounded-xl border border-border text-foreground hover:bg-secondary transition-all"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex-1 py-3 text-base font-bold rounded-xl bg-primary hover:brightness-110 text-primary-foreground transition-all flex items-center justify-center gap-2"
                >
                  Next →
                </button>
              </div>
            </>
          )}
          {step === 4 && (
            <>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Property Value</p>
              <p className="text-sm text-muted-foreground mb-2">Help us understand your property's value so we can make the best offer.</p>
              <div>
                <label htmlFor="home-market-price" className="sr-only">If you had to guess, what do you think it's worth as-is if you listed it today?</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <input
                    id="home-market-price"
                    type="text"
                    inputMode="numeric"
                    placeholder="Estimated market value (required)"
                    value={formatPriceDisplay(Number(marketPrice) || 0)}
                    onChange={(e) => setMarketPrice(e.target.value.replace(/[^0-9Kk]/g, ""))}
                    onBlur={() => {
                      const num = Number(marketPrice);
                      if (num > 0 && num < 1000) setMarketPrice(String(num * 1000));
                    }}
                    className="w-full h-12 text-base rounded-xl bg-secondary border border-border pl-12 pr-4 text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="home-lowest-price" className="sr-only">So if Tarek bought your house direct, as is, no commissions, no fees, no hassles, no open houses, and closed when you wanted, what's the lowest you would take?</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <input
                    id="home-lowest-price"
                    type="text"
                    inputMode="numeric"
                    placeholder="Lowest price you'd accept (required)"
                    value={formatPriceDisplay(Number(lowestPrice) || 0)}
                    onChange={(e) => setLowestPrice(e.target.value.replace(/[^0-9Kk]/g, ""))}
                    onBlur={() => {
                      const num = Number(lowestPrice);
                      if (num > 0 && num < 1000) setLowestPrice(String(num * 1000));
                    }}
                    className="w-full h-12 text-base rounded-xl bg-secondary border border-border pl-12 pr-4 text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>
              </div>
              {consentSection()}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 text-sm font-bold rounded-xl border border-border text-foreground hover:bg-secondary transition-all"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 text-base font-bold rounded-xl bg-primary hover:brightness-110 text-primary-foreground shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  {loading ? "Submitting…" : "Get My Free Offer"}
                </button>
              </div>
            </>
          )}
          <p className="text-center text-xs text-primary mt-1">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>{" "}|{" "}
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
          </p>
        </form>
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground mt-3">
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Private</span>
          <span>·</span><span>No Obligation</span><span>·</span><span>Free</span>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
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
                <Image src={tarekHeadshot} alt="Tarek El Moussa" width={48} height={48} className="rounded-full object-cover border-2 border-primary shadow-[0_0_10px_2px_hsl(38_92%_50%/0.45)]" />
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
                <a href={`sms:${TOLL_FREE_TEXT_E164}?body=${encodeURIComponent("Hi Tarek, I need to sell my house")}`} className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:brightness-110 transition-all text-lg shadow-amber">
                  <MessageCircle className="w-5 h-5" /> Text {TOLL_FREE_TEXT}
                </a>
                <a href={`tel:${TOLL_FREE_CALL_E164}`} className="inline-flex items-center gap-2 px-8 py-4 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-primary-foreground transition-all text-lg">
                  <Phone className="w-5 h-5" /> Call {TOLL_FREE_CALL}
                </a>
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
                {renderForm()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Media Logos */}
      <div className="bg-secondary/50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-xs text-muted-foreground font-semibold mb-4 uppercase tracking-widest text-center">As Featured On</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {MEDIA_LOGOS.map((logo) => {
              const img = (
                <img key={logo.name} src={logo.url} alt={logo.name} width={logo.width || 100} height={logo.height || 24} className={`opacity-70 grayscale invert ${logo.height && logo.width ? "" : "h-6 md:h-7 w-auto"}`} loading="lazy" />
              );
              return logo.href ? (
                <a key={logo.name} href={logo.href} target="_blank" rel="noopener noreferrer" className="hover:opacity-90 transition-opacity">
                  {img}
                </a>
              ) : (
                img
              );
            })}
          </div>
        </div>
      </div>

      <VideoSection
        heading="Watch Before You Call"
        subtitle="60 seconds. This is exactly how we help homeowners like you."
        phone={TOLL_FREE_CALL}
        text={TOLL_FREE_TEXT}
        smsLink={`sms:${TOLL_FREE_TEXT_E164}?body=${encodeURIComponent("Hi Tarek, I need to sell my house")}`}
        telLink={`tel:${TOLL_FREE_CALL_E164}`}
        showWhyTarek={false}
      />

      {/* How it Works */}
      <section className="py-20 max-w-7xl mx-auto px-4 hidden">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-4">How It Works</h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">Three simple steps to sell your home — no agents, no repairs, no waiting.</p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { num: "1", title: "Tell Us About Your Property", desc: "Enter your address and basic info. Takes 60 seconds." },
            { num: "2", title: "Get Your Cash Offer", desc: "We'll call you within 24 hours with a fair, no-obligation cash offer." },
            { num: "3", title: "Close on Your Timeline", desc: "Pick your closing date — as fast as 7 days. We handle everything." },
          ].map((s) => (
            <div key={s.num} className="relative bg-card border border-border rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary font-bold text-xl flex items-center justify-center mx-auto mb-4">{s.num}</div>
              <h3 className="text-lg font-bold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- REDESIGN CONCEPTS  */}
        <HowItWorksInteractivePreview />

        {/*HowItWorksEditorialAccordion */}

        {/*<HowItWorksConnectedTimeline />*/}

      {/* --- END REDESIGN CONCEPTS --- */}

      {/* Markets Grid */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-4">We Buy Homes in {allMarketKeys.length}+ Markets</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Nationwide coverage — find your local team.
            {detectedMarket && <span className="text-primary font-semibold"> We detected you're near {detectedMarket.name}!</span>}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {visibleMarkets.map((slug) => {
              const m = MARKETS[slug];
              if (!m) return null;
              const isDetected = detectedMarket?.slug === slug;
              return (
                <Link
                  key={slug}
                  href={`/markets/${slug}`}
                  className={`group bg-card border rounded-xl p-4 hover:border-primary transition-all ${isDetected ? "border-primary ring-1 ring-primary/30" : "border-border"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className={`w-4 h-4 ${isDetected ? "text-primary" : "text-muted-foreground"} group-hover:text-primary transition-colors`} />
                    <span className="font-semibold text-sm">{m.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{m.state}</span>
                  {isDetected && <span className="ml-2 text-xs text-primary font-semibold">📍 Near you</span>}
                </Link>
              );
            })}
          </div>
          {!showAllMarkets && allMarketKeys.length > FEATURED_MARKETS.length && (
            <div className="text-center mt-8">
              <button onClick={() => setShowAllMarkets(true)} className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
                Show all {allMarketKeys.length} markets <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 bg-primary/10">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Ready to Sell? Get Your Offer Today.</h2>
          <p className="text-muted-foreground mb-8">No fees. No repairs. No hassle. Just a fair cash offer from Tarek's team.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={`tel:${TOLL_FREE_CALL_E164}`} className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:brightness-110 transition-all text-lg shadow-amber">
              <Phone className="w-5 h-5" /> Call {TOLL_FREE_CALL}
            </a>
            <a href={`sms:${TOLL_FREE_TEXT_E164}?body=${encodeURIComponent("Hi Tarek, I need to sell my house")}`} className="inline-flex items-center gap-2 px-8 py-4 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-primary-foreground transition-all text-lg">
              <MessageCircle className="w-5 h-5" /> Text Us
            </a>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>

      <ChatWidget />
    </div>
  );
}
