"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { MessageCircle, Phone, Shield, CheckCircle, Send, ArrowRight, MapPin } from "lucide-react";
import { usePageConfig } from "@/context/PageContext";
import { submitLead } from "@/lib/leads";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { toast } from "sonner";
import { trackPhoneClick, trackSMSClick, trackConversion } from "@/lib/analytics";

const PHONE_REGEX = /^\+?1?\d{10,14}$/;
const TAG = "[TBH:finalcta]";

const FinalCTA = () => {
  const { phone, smsLink, telLink, situation, market, text } = usePageConfig();
  const router = useRouter();
  const pathname = usePathname();
  const [step, setStep] = useState<1 | 2>(1);
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [email, setEmail] = useState("");
  const [consentTransactional, setConsentTransactional] = useState(false);
  const [consentPromotional, setConsentPromotional] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    console.log(`${TAG} Step 1 → 2 (address entered)`);
    trackConversion("form_step_1", { source: "final_cta", market: market.slug });
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phoneInput) return;

    const stripped = phoneInput.replace(/[\s\-().]/g, "");
    if (!PHONE_REGEX.test(stripped)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    const start = performance.now();
    try {
      const recaptchaToken = await getRecaptchaToken("submit_lead");
      await submitLead(
        {
          name,
          phone: stripped,
          email: email || undefined,
          property_address: address || undefined,
          market_slug: market.slug,
          situation_slug: situation.slug,
          source: "final_cta",
          page_path: pathname,
        },
        recaptchaToken,
        idempotencyKey,
      );
      console.log(`${TAG} ✔ Lead submitted in ${(performance.now() - start).toFixed(0)}ms`);
      trackConversion("form_step_2", { source: "final_cta", market: market.slug });
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again or call us directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-2xl p-10 md:p-14 text-center"
          style={{
            background: "linear-gradient(135deg, hsl(38 92% 50% / 0.08), hsl(0 0% 7%), hsl(38 92% 50% / 0.04))",
            border: "1px solid hsl(38 92% 50% / 0.2)",
          }}
        >
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">{situation.finalCtaHeadline.replace("{market}", market.name)}</h2>
          <p className="text-muted-foreground text-lg mb-2">{situation.finalCtaSubline.replaceAll("{market}", market.name)}</p>
          <p className="text-muted-foreground text-sm mb-6 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            No obligation · 100% confidential · Speak with a local specialist
          </p>

          {submitted ? (
            <div className="flex flex-col items-center justify-center gap-1 text-primary font-bold text-lg mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> We'll reach out within minutes!
              </div>
            </div>
          ) : step === 1 ? (
            <form onSubmit={handleStep1} className="max-w-md mx-auto mb-6">
              <div className="relative mb-3">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <label htmlFor="final-address" className="sr-only">Property Address</label>
                <input
                  id="final-address"
                  type="text"
                  placeholder="Enter your property address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full h-14 rounded-xl bg-secondary border border-border pl-12 pr-4 text-foreground placeholder:text-muted-foreground text-base"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 font-bold rounded-xl bg-primary hover:brightness-110 text-primary-foreground shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Get My Cash Offer <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleStep2} className="max-w-md mx-auto mb-6 space-y-3">
              <div className="flex items-center gap-2 justify-center mb-2">
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">Step 2 of 2</span>
                <span className="text-xs text-muted-foreground">{address}</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label htmlFor="final-name" className="sr-only">First name</label>
                  <input id="final-name" type="text" placeholder="First name" value={name} onChange={(e) => setName(e.target.value)} className="w-full h-12 rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground" required />
                </div>
                <div className="flex-1">
                  <label htmlFor="final-phone" className="sr-only">Phone number</label>
                  <input id="final-phone" type="tel" placeholder="Phone" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} className="w-full h-12 rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground" required />
                </div>
              </div>
              <div>
                <label htmlFor="final-email" className="sr-only">Email (optional)</label>
                <input id="final-email" type="email" placeholder="Email (optional — for offer updates)" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-12 rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground" />
              </div>
              <div className="space-y-3 mt-8 mb-8">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider">SMS Consent</p>
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="consent-transactional-final" checked={consentTransactional} onChange={(e) => setConsentTransactional(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border shrink-0" />
                  <label htmlFor="consent-transactional-final" className="text-[9px] sm:text-[10px] leading-[13px] sm:leading-[14px] text-muted-foreground">
                    I consent to receive non-marketing text messages from Tarek Buys Houses, LLC about cash offer updates, appointment confirmations, and property follow-up communications. Message frequency may vary. Message &amp; data rates may apply. Text HELP for assistance, reply STOP to opt out.
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="consent-promotional-final" checked={consentPromotional} onChange={(e) => setConsentPromotional(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border shrink-0" />
                  <label htmlFor="consent-promotional-final" className="text-[9px] sm:text-[10px] leading-[13px] sm:leading-[14px] text-muted-foreground">
                    I consent to receive marketing text messages, about special offers, new listings, and market updates, from Tarek Buys Houses, LLC at the phone number provided. Message frequency may vary. Message &amp; data rates may apply. Text HELP for assistance, reply STOP to opt out.
                  </label>
                </div>
                <p className="text-[9px] sm:text-[10px] leading-[13px] sm:leading-[14px] text-muted-foreground">(SMS checkboxes are optional — you can still receive your cash offer without selecting any of the above)</p>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3.5 font-bold rounded-xl bg-primary hover:brightness-110 text-primary-foreground shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                <Send className="w-4 h-4" />
                {loading ? "Submitting…" : "Get My Free Offer"}
              </button>
              <button type="button" onClick={() => setStep(1)} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
                ← Change address
              </button>
              <p className="text-center text-xs text-primary mt-1">
                <Link href="/privacy" className="hover:underline">Privacy Policy</Link>{" "}|{" "}
                <Link href="/terms" className="hover:underline">Terms of Service</Link>
              </p>
            </form>
          )}

          <p className="text-muted-foreground text-sm mb-6">— or reach us directly —</p>

          <div className="flex flex-wrap gap-4 justify-center">
            <a href={smsLink} onClick={() => trackSMSClick(market.slug, situation.slug)} className="inline-flex items-center gap-2 px-10 py-5 bg-primary text-primary-foreground font-bold rounded-xl hover:brightness-110 transition-all text-xl shadow-amber">
              <MessageCircle className="w-5 h-5" /> Text {text}
            </a>
            <a href={telLink} onClick={() => trackPhoneClick(market.slug, situation.slug)} className="inline-flex items-center gap-2 px-10 py-5 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-primary-foreground transition-all text-xl">
              <Phone className="w-5 h-5" /> Call {phone}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
