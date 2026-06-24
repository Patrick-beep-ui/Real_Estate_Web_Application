"use client";

declare global {
  interface Window {
    grecaptcha: {
      ready(callback: () => void): void;
      execute(siteKey: string, options: { action: string }): Promise<string>;
    };
  }
}

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { MessageCircle, Phone, CheckCircle, Star, Shield, Send } from "lucide-react";
import { usePageConfig } from "@/context/PageContext";
import { submitLead } from "@/lib/leads";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { toast } from "sonner";
import { trackPhoneClick, trackSMSClick, trackFormView, trackConversion } from "@/lib/analytics";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import Image from "next/image";
import tarekHeadshot from "@/assets/tarek-headshot.png";

const PHONE_REGEX = /^\+?1?\d{10,14}$/;
const TAG = "[TBH:hero]";

const HeroSection = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { phone, smsLink, telLink, situation, market, text } = usePageConfig();
  const [formAddress, setFormAddress] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formConsentTransactional, setFormConsentTransactional] = useState(false);
  const [formConsentPromotional, setFormConsentPromotional] = useState(false);
  const [formEmail, setFormEmail] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [step, setStep] = useState(1);
  const [timelineToSell, setTimelineToSell] = useState("");
  const [listedWithAgent, setListedWithAgent] = useState("");
  const [propertyAge, setPropertyAge] = useState("");

  useEffect(() => {
    console.log(`${TAG} Form view — ${market.slug}×${situation.slug}`);
    trackFormView("hero_form", market.slug, situation.slug);
  }, [market.slug, situation.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAddress.trim() || !formName || !formPhone) return;

    const trimmedName = formName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      toast.error("Name must be 2-100 characters");
      return;
    }

    const stripped = formPhone.replace(/[\s\-().]/g, "");
    if (!PHONE_REGEX.test(stripped)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setFormLoading(true);
    const start = performance.now();
    try {
      const recaptchaToken = await getRecaptchaToken("submit_lead");
      await submitLead(
        {
          name: formName,
          phone: stripped,
          email: formEmail || undefined,
          property_address: formAddress,
          listed_with_agent: listedWithAgent || undefined,
          property_age: propertyAge || undefined,
          timeline_to_sell: timelineToSell || undefined,
          market_slug: market.slug,
          situation_slug: situation.slug,
          source: "hero_form",
          page_path: pathname,
          consent_transactional: formConsentTransactional,
          consent_promotional: formConsentPromotional,
        },
        recaptchaToken,
        idempotencyKey,
      );
      console.log(`${TAG} ✔ Lead submitted in ${(performance.now() - start).toFixed(0)}ms`);
      trackConversion("form_submitted", { source: "hero_form", market: market.slug });
      router.push(`/landing/thank-you?market=${market.slug}&phone=${encodeURIComponent(phone)}`);
    } catch {
      toast.error("Something went wrong. Please try again or call us directly.");
    } finally {
      setFormLoading(false);
    }
  };

  const canAdvanceFromStep1 = formAddress.trim().length > 0;
  const canAdvanceFromStep2 = formName.trim().length > 0 && formPhone.trim().length > 0;

  const stepIndicator = () => (
    <div className="flex items-center justify-center gap-1 mb-6">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-1">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              s <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {s}
          </div>
          {s < 3 && <div className={`w-6 h-0.5 transition-colors ${s < step ? "bg-primary" : "bg-border"}`} />}
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
          id="consent-transactional-hero"
          checked={formConsentTransactional}
          onChange={(e) => setFormConsentTransactional(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border shrink-0"
          required
        />
        <label htmlFor="consent-transactional-hero" className="text-[10px] leading-[14px] text-muted-foreground">
          I consent to receive non-marketing text messages from Tarek Buys Houses, LLC about appointment confirmations and property follow-up communications. Message frequency may vary. Message &amp; data rates may apply. Text HELP for assistance, reply STOP to opt out.
        </label>
      </div>
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="consent-promotional-hero"
          checked={formConsentPromotional}
          onChange={(e) => setFormConsentPromotional(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border shrink-0"
        />
        <label htmlFor="consent-promotional-hero" className="text-[10px] leading-[14px] text-muted-foreground">
          I consent to receive marketing text messages, about special offers, new listings, and market updates, from Tarek Buys Houses, LLC at the phone number provided. Message frequency may vary. Message &amp; data rates may apply. Text HELP for assistance, reply STOP to opt out.
        </label>
      </div>
      <p className="text-[10px] leading-[14px] text-muted-foreground">(SMS checkboxes are optional — you can still receive your cash offer without selecting any of the above)</p>
      <div className="flex items-start gap-2 mt-6">
        <input type="checkbox" id="privacy-terms-sticky" className="mt-1 h-4 w-4 rounded border-border shrink-0" required />
        <label htmlFor="privacy-terms-sticky" className="text-[9px] sm:text-[10px] leading-[13px] sm:leading-[14px] text-muted-foreground">
          I agree to the <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a> and <a href="/terms" className="underline hover:text-foreground">Terms of Service</a>. I acknowledge that my mobile opt-in information and SMS consent will not be shared with third parties or affiliates for marketing or promotional purposes.
        </label>
      </div>
    </div>
  );

  const renderForm = () => (
    <>
      <h3 className="text-lg font-bold text-foreground mb-1">Get Your Free Cash Offer</h3>
      <p className="text-sm text-muted-foreground mb-5">Enter your address and info to get started.</p>
      {stepIndicator()}
      <form onSubmit={handleSubmit} className="space-y-3">
        {step === 1 && (
          <>
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Property Address</p>
            <AddressAutocomplete
              id="hero-address"
              value={formAddress}
              onChange={setFormAddress}
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
            <div>
              <label htmlFor="hero-name" className="sr-only">Your first name</label>
              <input
                id="hero-name"
                type="text"
                placeholder="Your first name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>
            <div>
              <label htmlFor="hero-phone" className="sr-only">Your phone number</label>
              <input
                id="hero-phone"
                type="tel"
                placeholder="Your phone number"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>
            <div>
              <label htmlFor="hero-email" className="sr-only">Email (optional)</label>
              <input
                id="hero-email"
                type="email"
                placeholder="Email (optional — for offer updates)"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            {consentSection()}
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
              id="hero-timeline"
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
              id="hero-listed"
              value={listedWithAgent}
              onChange={(e) => setListedWithAgent(e.target.value)}
              className={`w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 ${!listedWithAgent ? "text-muted-foreground" : "text-foreground"}`}
            >
              <option value="">Is the property currently listed with a real estate agent?</option>
              <option value="Listed">Listed</option>
              <option value="Unlisted">Unlisted</option>
            </select>
            <select
              id="hero-age"
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
            {consentSection()}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 text-sm font-bold rounded-xl border border-border text-foreground hover:bg-secondary transition-all"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="flex-1 py-3 text-base font-bold rounded-xl bg-primary hover:brightness-110 text-primary-foreground shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                {formLoading ? "Submitting…" : "Get My Free Offer"}
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
        <span>·</span>
        <span>No Obligation</span>
        <span>·</span>
        <span>Free</span>
      </div>
    </>
  );

  return (
    <section className="relative min-h-[600px] md:min-h-[680px] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={situation.heroImage}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/50" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-5 gap-10 items-center">
          <div className="lg:col-span-3">
            <div className="flex items-center gap-3 mb-6">
              <a href="/" className="inline-block">
                <Image src={tarekHeadshot} alt="Tarek El Moussa" width={65} height={65} className="w-12 h-12 rounded-full object-cover border-2 border-primary" />
              </a>
              <span className="text-sm text-muted-foreground">Tarek El Moussa · As Seen on HGTV</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 whitespace-pre-line">
              {situation.headline.replace("{market}", market.name)} 
            </h1>
            <p className="text-sm font-semibold text-primary mb-4">Serving {market.name} &amp; Surrounding Areas</p>
            {situation.bodyParagraphs.map((p, i) => (
              <p key={i} className="text-base sm:text-lg leading-relaxed mb-8 text-muted-foreground max-w-xl">
                {p.replaceAll("{market}", market.name)}
              </p>
            ))}
            <ul className="space-y-3 mb-8">
              {situation.bullets.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{item.replaceAll("{market}", market.name)}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-4 mb-6">
              <a href={smsLink} onClick={() => trackSMSClick(market.slug, situation.slug)} className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:brightness-110 transition-all text-lg shadow-amber">
                <MessageCircle className="w-5 h-5" /> Text {text}
              </a>
              <a href={telLink} onClick={() => trackPhoneClick(market.slug, situation.slug)} className="inline-flex items-center gap-2 px-8 py-4 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-primary-foreground transition-all text-lg">
                <Phone className="w-5 h-5" /> Call {phone}
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
                <span className="text-primary font-semibold">{market.stats.googleRating} Google</span>
              </a>
              <span>·</span>
                <a href="https://listwithclever.com/cash-home-buyers/reviews/tarek-buys-houses/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">{market.stats.bbbRating} BBB</a>
              <span>·</span>
              <span>{market.stats.homesClosed} Homes Purchased</span>
              <span>·</span>
              <span>As Seen on HGTV</span>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div id="hero-form" className="bg-card/90 backdrop-blur-md border border-border rounded-2xl p-6 shadow-2xl">
              {renderForm()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
