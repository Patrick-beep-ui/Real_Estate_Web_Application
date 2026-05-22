"use client";

declare global {
  interface Window {
    grecaptcha: {
      ready(callback: () => void): void;
      execute(siteKey: string, options: { action: string }): Promise<string>;
    };
  }
}

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Phone, Shield, Clock, Loader2, ArrowRight, MapPin, Send } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { usePageConfig } from "@/context/PageContext";
import { submitLead } from "@/lib/leads";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { toast } from "sonner";
import { trackConversion } from "@/lib/analytics";

const PHONE_REGEX = /^\+?1?\d{10,14}$/;
const TAG = "[TBH:exit]";

const ExitIntentPopup = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { phone, telLink, market, situation } = usePageConfig();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem("exit_popup_dismissed") === "true"; } catch { return false; }
  });
  const [step, setStep] = useState<1 | 2>(1);
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [email, setEmail] = useState("");
  const [consentTransactional, setConsentTransactional] = useState(false);
  const [consentPromotional, setConsentPromotional] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const mountTime = useRef(Date.now());
  const triggered = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (triggered.current || dismissed) return;
    if (Date.now() - mountTime.current < 30000) return;
    if (e.clientY > 0) return;
    triggered.current = true;
    console.log(`${TAG} ▶ Triggered via MOUSELEAVE after ${((Date.now() - mountTime.current) / 1000).toFixed(1)}s`);
    setShow(true);
  }, [dismissed]);

  useEffect(() => {
    if (dismissed || triggered.current) return;
    let maxScroll = 0;
    let scrollUpCount = 0;
    const handleScroll = () => {
      if (triggered.current || dismissed) return;
      if (Date.now() - mountTime.current < 30000) return;
      const scrollY = window.scrollY;
      const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = pageHeight > 0 ? scrollY / pageHeight : 0;
      if (scrollY > maxScroll) { maxScroll = scrollY; scrollUpCount = 0; }
      else if (maxScroll - scrollY > 200 && scrollPercent > 0.3) {
        scrollUpCount++;
        if (scrollUpCount >= 3) {
          triggered.current = true;
          console.log(`${TAG} ▶ Triggered via SCROLL-UP after ${((Date.now() - mountTime.current) / 1000).toFixed(1)}s`);
          setShow(true);
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [dismissed]);

  useEffect(() => {
    if (dismissed) return;
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    return () => document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
  }, [handleMouseLeave, dismissed]);

  const close = () => {
    console.log(`${TAG} Dismissed by user`);
    setShow(false);
    setDismissed(true);
    try { sessionStorage.setItem("exit_popup_dismissed", "true"); } catch {}
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    console.log(`${TAG} Step 1 → 2`);
    trackConversion("form_step_1", { source: "exit_intent", market: market.slug });
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phoneInput || !consentTransactional || !consentPrivacy) return;
    const stripped = phoneInput.replace(/[\s\-().]/g, "");
    if (!PHONE_REGEX.test(stripped)) { toast.error("Please enter a valid phone number"); return; }

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
          source: "exit_intent",
          page_path: pathname,
        },
        recaptchaToken
      );
      console.log(`${TAG} ✔ Lead submitted in ${(performance.now() - start).toFixed(0)}ms`);
      trackConversion("form_step_2", { source: "exit_intent", market: market.slug });
      router.push(`/landing/thank-you?market=${market.slug}&phone=${encodeURIComponent(phone)}`);
    } catch {
      toast.error("Something went wrong. Please try again or call us directly.");
    } finally {
      setLoading(false);
    }
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={close} role="dialog" aria-modal="true" aria-label="Before you go — get a callback">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div ref={dialogRef} className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overscroll-contain animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* HEADER - Fixed, doesn't scroll */}
        <div className="flex-shrink-0">
          <div className="bg-gradient-to-br from-background to-card p-4 sm:p-6 pb-6 sm:pb-8 text-center">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Wait — Before You Go</p>
            <h3 className="text-2xl font-bold leading-tight mb-2 text-foreground">
              {step === 1 ? <>Get a Free <span className="text-primary">Cash Offer</span></> : <>Almost There!</>}
            </h3>
            <p className="text-muted-foreground text-sm">
              {step === 1 ? "Just enter your address — takes 10 seconds." : "Tell us how to reach you."}
            </p>
          </div>
        </div>

        {/* SCROLLABLE FORM AREA */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {step === 1 ? (
            <form onSubmit={handleStep1} className="p-4 sm:p-6 space-y-4">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <label htmlFor="exit-address" className="sr-only">Property Address</label>
                <input id="exit-address" type="text" placeholder="Enter your property address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full h-14 text-base rounded-xl bg-secondary border border-border pl-12 pr-4 text-foreground placeholder:text-muted-foreground" required />
              </div>
              <button type="submit" className="w-full py-3 text-base font-bold rounded-xl bg-primary hover:brightness-110 text-primary-foreground shadow-lg transition-all flex items-center justify-center gap-2">
                Get My Cash Offer <ArrowRight className="w-4 h-4" />
              </button>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Private & Discreet</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Takes 10 seconds</span>
              </div>
            </form>
          ) : (
            <form id="exit-intent-form" onSubmit={handleStep2} className="p-4 sm:p-6 space-y-4 pb-4">
              <p className="text-xs text-muted-foreground truncate">📍 {address}</p>
              <div>
                <label htmlFor="exit-name" className="sr-only">Your first name</label>
                <input id="exit-name" type="text" placeholder="Your first name" value={name} onChange={(e) => setName(e.target.value)} className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground" required />
              </div>
              <div>
                <label htmlFor="exit-phone" className="sr-only">Your phone number</label>
                <input id="exit-phone" type="tel" placeholder="Your phone number" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground" required />
              </div>
              <div>
                <label htmlFor="exit-email" className="sr-only">Email (optional)</label>
                <input id="exit-email" type="email" placeholder="Email (optional — for offer updates)" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground" />
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider">SMS Consent</p>
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="consent-transactional-exit" checked={consentTransactional} onChange={(e) => setConsentTransactional(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border shrink-0" required />
                  <label htmlFor="consent-transactional-exit" className="text-[9px] sm:text-[10px] leading-[13px] sm:leading-[14px] text-muted-foreground">
                    I agree to receive transactional/informational SMS messages from Tarek Buys Houses (e.g., appointment confirmations, offer updates, property status notifications, customer care). Message frequency varies. Msg &amp; data rates may apply. Reply STOP to opt out, HELP for help.
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="consent-promotional-exit" checked={consentPromotional} onChange={(e) => setConsentPromotional(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border shrink-0" />
                  <label htmlFor="consent-promotional-exit" className="text-[9px] sm:text-[10px] leading-[13px] sm:leading-[14px] text-muted-foreground">
                    I agree to receive promotional/marketing SMS messages from Tarek Buys Houses and approved real estate partners (e.g., new listings, market updates, special offers). Message frequency varies. Msg &amp; data rates may apply. Reply STOP to opt out, HELP for help.
                  </label>
                </div>
                <p className="text-[9px] sm:text-[10px] leading-[13px] sm:leading-[14px] text-muted-foreground">Message frequency varies. Msg &amp; data rates may apply. Reply STOP to opt out, HELP for help.</p>
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="consent-privacy-exit" checked={consentPrivacy} onChange={(e) => setConsentPrivacy(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border shrink-0" required />
                  <label htmlFor="consent-privacy-exit" className="text-[9px] sm:text-[10px] leading-[13px] sm:leading-[14px] text-muted-foreground">
                    I agree to the{" "}
                    <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link> and{" "}
                    <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link>. I acknowledge that my mobile opt-in information and SMS consent will not be shared with third parties or affiliates for marketing or promotional purposes.
                  </label>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* STICKY BUTTONS - Fixed at bottom, never scroll */}
        {step === 2 && (
          <div className="flex-shrink-0 relative">
            <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-t from-card/95 to-transparent -translate-y-full pointer-events-none" />
            <div className="bg-card/95 backdrop-blur-sm border-t border-border p-4 sm:p-6">
              <button
                type="submit"
                form="exit-intent-form"
                disabled={loading}
                className="w-full py-3 text-base font-bold rounded-xl bg-primary hover:brightness-110 text-primary-foreground shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><Send className="w-4 h-4" /> Request a Callback</>}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
              >
                ← Change address
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExitIntentPopup;
