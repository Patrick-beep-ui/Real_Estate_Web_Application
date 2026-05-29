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
import { MessageCircle, Phone, CheckCircle, Star, Shield, Send, ArrowRight, MapPin } from "lucide-react";
import { usePageConfig } from "@/context/PageContext";
import { submitLead } from "@/lib/leads";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { toast } from "sonner";
import { trackPhoneClick, trackSMSClick, trackFormView, trackConversion } from "@/lib/analytics";
import Image from "next/image";
import tarekHeadshot from "@/assets/tarek-headshot.png";

const PHONE_REGEX = /^\+?1?\d{10,14}$/;
const TAG = "[TBH:hero]";

const HeroSection = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { phone, smsLink, telLink, situation, market, text } = usePageConfig();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formAddress, setFormAddress] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formConsentTransactional, setFormConsentTransactional] = useState(false);
  const [formConsentPromotional, setFormConsentPromotional] = useState(false);
  const [formEmail, setFormEmail] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    console.log(`${TAG} Form view — ${market.slug}×${situation.slug}`);
    trackFormView("hero_form", market.slug, situation.slug);
  }, [market.slug, situation.slug]);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAddress.trim()) return;
    console.log(`${TAG} Step 1 → 2 (address entered)`);
    trackConversion("form_step_1", { source: "hero_form", market: market.slug });
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone) return;

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
          property_address: formAddress || undefined,
          market_slug: market.slug,
          situation_slug: situation.slug,
          source: "hero_form",
          page_path: pathname,
        },
        recaptchaToken,
        idempotencyKey,
      );
      console.log(`${TAG} ✔ Step 2 lead submitted in ${(performance.now() - start).toFixed(0)}ms`);
      trackConversion("form_step_2", { source: "hero_form", market: market.slug });
      router.push(`/landing/thank-you?market=${market.slug}&phone=${encodeURIComponent(phone)}`);
    } catch {
      toast.error("Something went wrong. Please try again or call us directly.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formEmail) {
      try {
        const strippedPhone = formPhone.replace(/[\s\-().]/g, "");
        const recaptchaToken = await getRecaptchaToken("submit_lead_followup");
        await submitLead(
          {
            name: formName,
            phone: strippedPhone,
            email: formEmail,
            property_address: formAddress || undefined,
            market_slug: market.slug,
            situation_slug: situation.slug,
            source: "hero_form_followup",
            page_path: pathname,
          },
          recaptchaToken,
          idempotencyKey,
        );
        console.log(`${TAG} ✔ Step 3 email submitted`);
      } catch {
        console.warn(`${TAG} Step 3 followup failed (non-critical)`);
      }
    }
    router.push(`/landing/thank-you?market=${market.slug}&phone=${encodeURIComponent(phone)}`);
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
            {formEmail && " A welcome email is on the way."}
          </p>
        </div>
      );
    }

    if (step === 1) {
      return (
        <>
          <h3 className="text-lg font-bold text-foreground mb-1">Get Your Free Cash Offer</h3>
          <p className="text-sm text-muted-foreground mb-5">Enter your property address to get started.</p>
          <form onSubmit={handleStep1} className="space-y-3">
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <label htmlFor="hero-address" className="sr-only">Property Address</label>
              <input
                id="hero-address"
                type="text"
                placeholder="Enter your property address"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                className="w-full h-14 text-base rounded-xl bg-secondary border border-border pl-12 pr-4 text-foreground placeholder:text-muted-foreground"
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 text-base font-bold rounded-xl bg-primary hover:brightness-110 text-primary-foreground shadow-lg transition-all flex items-center justify-center gap-2"
            >
              Get My Cash Offer <ArrowRight className="w-4 h-4" />
            </button>
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
    }

    if (step === 2) {
      return (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">Step 2 of 2</span>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">Almost There!</h3>
          <p className="text-sm text-muted-foreground mb-4">Tell us how to reach you for your offer.</p>
          <form onSubmit={handleStep2} className="space-y-3">
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
                autoFocus
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
              <label htmlFor="hero-email-2" className="sr-only">Email (optional)</label>
              <input
                id="hero-email-2"
                type="email"
                placeholder="Email (optional — for offer updates)"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-3 mt-8 mb-8">
               <p className="text-xs font-semibold text-foreground uppercase tracking-wider">SMS Consent</p>
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="consent-transactional-hero"
                  checked={formConsentTransactional}
                  onChange={(e) => setFormConsentTransactional(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border shrink-0"
                />
                <label htmlFor="consent-transactional-hero" className="text-[10px] leading-[14px] text-muted-foreground">
                  I consent to receive non-marketing text messages from Tarek Buys Houses, LLC about cash offer updates, appointment confirmations, and property follow-up communications. Message frequency may vary. Message &amp; data rates may apply. Text HELP for assistance, reply STOP to opt out.
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
            </div>
            <button
              type="submit"
              disabled={formLoading}
              className="w-full py-3.5 text-base font-bold rounded-xl bg-primary hover:brightness-110 text-primary-foreground shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {formLoading ? "Submitting…" : "Get My Free Offer"}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to address
            </button>
            <p className="text-center text-xs text-primary mt-1">
              <Link href="/privacy" className="hover:underline">Privacy Policy</Link>{" "}|{" "}
              <Link href="/terms" className="hover:underline">Terms of Service</Link>
            </p>
          </form>
        </>
      );
    }

    return (
      <>
        <div className="text-center mb-4">
          <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
          <h3 className="text-lg font-bold text-foreground">Got It! We're On It.</h3>
          <p className="text-sm text-muted-foreground">Want updates by email too? (Optional)</p>
        </div>
        <form onSubmit={handleStep3} className="space-y-3">
          <div>
            <label htmlFor="hero-email" className="sr-only">Email</label>
            <input
              id="hero-email"
              type="email"
              placeholder="Your email address"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 font-bold rounded-xl bg-primary hover:brightness-110 text-primary-foreground shadow-lg transition-all"
            >
              {formEmail ? "Save & Finish" : "Skip"}
            </button>
          </div>
        </form>
      </>
    );
  };

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
              <a href="https://www.google.com/search?q=Tarek+Buys+Houses+reviews" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                <Star className="w-4 h-4 text-primary fill-primary" />
                <span className="text-primary font-semibold">{market.stats.googleRating} Google</span>
              </a>
              <span>·</span>
              <a href="https://www.bbb.org/search?find_country=US&find_text=Tarek+Buys+Houses" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">{market.stats.bbbRating} BBB</a>
              <span>·</span>
              <span>{market.stats.homesClosed} Homes Purchased</span>
              <span>·</span>
              <span>As Seen on HGTV</span>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-card/90 backdrop-blur-md border border-border rounded-2xl p-6 shadow-2xl">
              {renderForm()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
