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
import { Phone, Send, CheckCircle, X, ChevronUp, ArrowRight, MapPin } from "lucide-react";
import { usePageConfig } from "@/context/PageContext";
import { submitLead } from "@/lib/leads";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { toast } from "sonner";
import { trackPhoneClick, trackConversion } from "@/lib/analytics";

const PHONE_REGEX = /^\+?1?\d{10,14}$/;
const TAG = "[TBH:sticky]";

const StickyMobileCTA = () => {
  const { phone, telLink, market, situation } = usePageConfig();
  const router = useRouter();
  const pathname = usePathname();
  const [step, setStep] = useState<0 | 1 | 2>(0); // 0=collapsed, 1=address, 2=name+phone
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [phoneVal, setPhoneVal] = useState("");
  const [email, setEmail] = useState("");
  const [consentTransactional, setConsentTransactional] = useState(false);
  const [consentPromotional, setConsentPromotional] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const expanded = step > 0;

  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        setSubmitted(false);
        setStep(0);
        setAddress("");
        setName("");
        setPhoneVal("");
        setEmail("");
        setConsentTransactional(false);
        setConsentPromotional(false);
        setConsentPrivacy(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [submitted]);

  useEffect(() => {
    console.log(`${TAG} expanded=${expanded}`);
    window.dispatchEvent(new CustomEvent("sticky_cta_state", { detail: { expanded } }));
  }, [expanded]);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    console.log(`${TAG} Step 1 → 2 (address entered)`);
    trackConversion("form_step_1", { source: "sticky_mobile", market: market.slug });
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phoneVal || !consentTransactional || !consentPrivacy) return;

    const stripped = phoneVal.replace(/[\s\-().]/g, "");
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
          source: "sticky_mobile",
          page_path: pathname,
        },
        recaptchaToken
      );
      console.log(`${TAG} ✔ Lead submitted in ${(performance.now() - start).toFixed(0)}ms`);
      trackConversion("form_step_2", { source: "sticky_mobile", market: market.slug });
      router.push(`/landing/thank-you?market=${market.slug}&phone=${encodeURIComponent(phone)}`);
    } catch {
      toast.error("Something went wrong. Please try calling us directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border shadow-[-4px_20px_rgba(0,0,0,0.1)]"
      role="complementary"
      aria-label="Quick contact options"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {step === 0 ? (
        <button
          onClick={() => setStep(1)}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm active:opacity-90 transition-opacity"
        >
          <ChevronUp className="w-4 h-4" aria-hidden="true" />
          Get Your Free Cash Offer
        </button>
      ) : (
        <div className="px-4 pt-3 pb-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-foreground">
              {step === 1 ? "Get Your Free Offer" : "Almost Done!"}
            </span>
            <button onClick={() => setStep(0)} className="p-1 rounded-full text-muted-foreground hover:text-foreground" aria-label="Close form">
              <X className="w-4 h-4" />
            </button>
          </div>

          {step === 1 ? (
            <form onSubmit={handleStep1} className="space-y-2">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <label htmlFor="sticky-address" className="sr-only">Property Address</label>
                <input
                  id="sticky-address"
                  type="text"
                  placeholder="Enter your property address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="w-full h-10 rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 h-10 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm active:opacity-90 transition-opacity">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
                <a href={telLink} onClick={() => trackPhoneClick(market.slug, situation.slug)} className="flex items-center justify-center gap-1 h-10 px-3 rounded-md border border-input text-muted-foreground text-sm hover:text-foreground transition-colors" aria-label={`Call us at ${phone}`}>
                  <Phone className="w-4 h-4" /> Call
                </a>
              </div>
            </form>
          ) : (
            <form onSubmit={handleStep2} className="space-y-2">
              <p className="text-xs text-muted-foreground mb-1 truncate">📍 {address}</p>
              <div>
                <label htmlFor="sticky-name" className="sr-only">Your Name</label>
                <input id="sticky-name" type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label htmlFor="sticky-phone" className="sr-only">Phone Number</label>
                <input id="sticky-phone" type="tel" placeholder="Phone Number" value={phoneVal} onChange={(e) => setPhoneVal(e.target.value)} required className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label htmlFor="sticky-email" className="sr-only">Email (optional)</label>
                <input id="sticky-email" type="email" placeholder="Email (optional — for offer updates)" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider">SMS Consent</p>
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="consent-transactional-sticky" checked={consentTransactional} onChange={(e) => setConsentTransactional(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border shrink-0" required />
                  <label htmlFor="consent-transactional-sticky" className="text-[9px] sm:text-[10px] leading-[13px] sm:leading-[14px] text-muted-foreground">
                    I agree to receive transactional/informational SMS messages from Tarek Buys Houses (e.g., appointment confirmations, offer updates, property status notifications, customer care). Message frequency varies. Msg &amp; data rates may apply. Reply STOP to opt out, HELP for help.
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="consent-promotional-sticky" checked={consentPromotional} onChange={(e) => setConsentPromotional(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border shrink-0" />
                  <label htmlFor="consent-promotional-sticky" className="text-[9px] sm:text-[10px] leading-[13px] sm:leading-[14px] text-muted-foreground">
                    I agree to receive promotional/marketing SMS messages from Tarek Buys Houses and approved real estate partners (e.g., new listings, market updates, special offers). Message frequency varies. Msg &amp; data rates may apply. Reply STOP to opt out, HELP for help.
                  </label>
                </div>
                <p className="text-[9px] sm:text-[10px] leading-[13px] sm:leading-[14px] text-muted-foreground">Message frequency varies. Msg &amp; data rates may apply. Reply STOP to opt out, HELP for help.</p>
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="consent-privacy-sticky" checked={consentPrivacy} onChange={(e) => setConsentPrivacy(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border shrink-0" required />
                  <label htmlFor="consent-privacy-sticky" className="text-[9px] sm:text-[10px] leading-[13px] sm:leading-[14px] text-muted-foreground">
                    I agree to the{" "}
                    <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a> and{" "}
                    <a href="/terms" className="underline hover:text-foreground">Terms of Service</a>. I acknowledge that my mobile opt-in information and SMS consent will not be shared with third parties or affiliates for marketing or promotional purposes.
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={loading || !name || !phoneVal || !consentTransactional || !consentPrivacy} className="flex-1 flex items-center justify-center gap-2 h-10 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm disabled:opacity-50 active:opacity-90 transition-opacity">
                  <Send className="w-4 h-4" /> {loading ? "Sending…" : "Submit"}
                </button>
                <button type="button" onClick={() => setStep(1)} className="h-10 px-3 rounded-md border border-input text-muted-foreground text-sm hover:text-foreground transition-colors">
                  ← Change address
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default StickyMobileCTA;
