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
import { X, Phone, Shield, Clock, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { usePageConfig } from "@/context/PageContext";
import { submitLead } from "@/lib/leads";
import { validatePhone, validateEmail, stripPhone, formatPhoneDisplay } from "@/lib/leads/helpers";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { toast } from "sonner";
import { trackConversion } from "@/lib/analytics";

const TAG = "[TBH:exit]";

const ExitIntentPopup = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { phone, telLink, market, situation } = usePageConfig();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem("exit_popup_dismissed") === "true"; } catch { return false; }
  });
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [email, setEmail] = useState("");
  const [timelineToSell, setTimelineToSell] = useState("");
  const [listedWithAgent, setListedWithAgent] = useState("");
  const [propertyAge, setPropertyAge] = useState("");
  const [consentTransactional, setConsentTransactional] = useState(false);
  const [consentPromotional, setConsentPromotional] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [step, setStep] = useState(1);
  const mountTime = useRef(Date.now());
  const triggered = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const canAdvanceFromStep1 = address.trim().length > 0;
  const canAdvanceFromStep2 = name.trim().length > 0 && phoneInput.trim().length > 0;

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

    const consentSection = () => (
    <div className="space-y-3 mt-6 mb-6">
      <p className="text-xs font-semibold text-foreground uppercase tracking-wider">SMS Consent</p>
      <div className="flex items-start gap-2">
        <input type="checkbox" id="consent-transactional-exit" checked={consentTransactional} onChange={(e) => setConsentTransactional(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border shrink-0" />
        <label htmlFor="consent-transactional-exit" className="text-[9px] sm:text-[10px] leading-[13px] sm:leading-[14px] text-muted-foreground">
          I consent to receive non-marketing text messages from Tarek Buys Houses, LLC about appointment confirmations and property follow-up communications. Message frequency may vary. Message &amp; data rates may apply. Text HELP for assistance, reply STOP to opt out.
        </label>
      </div>
      <div className="flex items-start gap-2">
        <input type="checkbox" id="consent-promotional-exit" checked={consentPromotional} onChange={(e) => setConsentPromotional(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border shrink-0" />
        <label htmlFor="consent-promotional-exit" className="text-[9px] sm:text-[10px] leading-[13px] sm:leading-[14px] text-muted-foreground">
          I consent to receive marketing text messages, about special offers, new listings, and market updates, from Tarek Buys Houses, LLC at the phone number provided. Message frequency may vary. Message &amp; data rates may apply. Text HELP for assistance, reply STOP to opt out.
        </label>
      </div>
      <p className="text-[9px] sm:text-[10px] leading-[13px] sm:leading-[14px] text-muted-foreground">(SMS checkboxes are optional — you can still receive your cash offer without selecting any of the above)</p>
      <div className="flex items-start gap-2 mt-6">
        <input type="checkbox" id="privacy-terms-sticky" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border shrink-0" required />
        <label htmlFor="privacy-terms-sticky" className="text-[9px] sm:text-[10px] leading-[13px] sm:leading-[14px] text-muted-foreground">
          I agree to the <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a> and <a href="/terms" className="underline hover:text-foreground">Terms of Service</a>. I acknowledge that my mobile opt-in information and SMS consent will not be shared with third parties or affiliates for marketing or promotional purposes.
        </label>
      </div>
    </div>
  );

  const stepIndicator = () => (
    <div className="flex items-center justify-center gap-1 mb-5">
      {[1, 2, 3].map((s) => (
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

  const close = () => {
    console.log(`${TAG} Dismissed by user`);
    setShow(false);
    setDismissed(true);
    try { sessionStorage.setItem("exit_popup_dismissed", "true"); } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || !name || !phoneInput) return;

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      toast.error("Name must be 2-100 characters");
      return;
    }

    if (!validatePhone(phoneInput)) { toast.error("Please enter a valid phone number"); return; }

    if (email && !validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!timelineToSell || !listedWithAgent || !propertyAge) {
      toast.error("Please answer all property details questions");
      return;
    }

    setLoading(true);
    const start = performance.now();
    try {
      const recaptchaToken = await getRecaptchaToken("submit_lead");
      await submitLead(
        {
          name,
          phone: stripPhone(phoneInput),
          email: email || undefined,
          property_address: address,
          listed_with_agent: listedWithAgent || undefined,
          property_age: propertyAge || undefined,
          timeline_to_sell: timelineToSell || undefined,
          market_slug: market.slug,
          situation_slug: situation.slug,
          source: "exit_intent",
          page_path: pathname,
          consent_transactional: consentTransactional,
          consent_promotional: consentPromotional,
        },
        recaptchaToken,
        idempotencyKey,
      );
      console.log(`${TAG} ✔ Lead submitted in ${(performance.now() - start).toFixed(0)}ms`);
      trackConversion("form_submitted", { source: "exit_intent", market: market.slug });
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
              Get a Free <span className="text-primary">Cash Offer</span>
            </h3>
            <p className="text-muted-foreground text-sm">
              Enter your info — takes 30 seconds.
            </p>
          </div>
        </div>

        {/* SCROLLABLE FORM AREA */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 sm:p-6 pb-4">
            {stepIndicator()}
            <form id="exit-intent-form" onSubmit={handleSubmit} className="space-y-4">
              {step === 1 && (
                <>
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Property Address</p>
                  <AddressAutocomplete id="exit-address" value={address} onChange={setAddress} className="w-full h-14 text-base rounded-xl bg-secondary border border-border pl-12 pr-4 text-foreground placeholder:text-muted-foreground" required autoFocus />
                </>
              )}
              {step === 2 && (
                <>
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Your Information</p>
                  <div>
                    <label htmlFor="exit-name" className="sr-only">Your first name</label>
                    <input id="exit-name" type="text" placeholder="Your first name" value={name} onChange={(e) => setName(e.target.value)} className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground" required />
                  </div>
                  <div>
                    <label htmlFor="exit-phone" className="sr-only">Your phone number</label>
                    <input id="exit-phone" type="tel" placeholder="(555) 123-4567" value={phoneInput} onChange={(e) => setPhoneInput(formatPhoneDisplay(e.target.value))} className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground" required />
                  </div>
                  <div>
                    <label htmlFor="exit-email" className="sr-only">Email (optional)</label>
                    <input id="exit-email" type="email" placeholder="Email (optional — for offer updates)" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground" />
                  </div>
                  {consentSection()}
                </>
              )}
              {step === 3 && (
                <>
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Property Details</p>
                  <select
                    id="exit-timeline"
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
                    id="exit-listed"
                    value={listedWithAgent}
                    onChange={(e) => setListedWithAgent(e.target.value)}
                    className={`w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 ${!listedWithAgent ? "text-muted-foreground" : "text-foreground"}`}
                  >
                    <option value="">Is the property currently listed with a real estate agent?</option>
                    <option value="Listed">Listed</option>
                    <option value="Unlisted">Unlisted</option>
                  </select>
                  <select
                    id="exit-age"
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
                </>
              )}
            </form>
          </div>
        </div>

        {/* STICKY BUTTONS - Fixed at bottom, never scroll */}
        <div className="flex-shrink-0 relative">
          <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-t from-card/95 to-transparent -translate-y-full pointer-events-none" />
          <div className="bg-card/95 backdrop-blur-sm border-t border-border p-4 sm:p-6">
            {step === 1 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canAdvanceFromStep1}
                className="w-full py-3 text-sm font-bold rounded-xl bg-primary hover:brightness-125 text-primary-foreground transition-all disabled:opacity-40"
              >
                Next →
              </button>
            )}
            {step === 2 && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 text-sm font-bold rounded-xl border border-border text-foreground hover:bg-secondary transition-all"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!canAdvanceFromStep2}
                  className="flex-1 py-3 text-sm font-bold rounded-xl bg-primary hover:brightness-125 text-primary-foreground transition-all disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
            {step === 3 && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 text-sm font-bold rounded-xl border border-border text-foreground hover:bg-secondary transition-all"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  form="exit-intent-form"
                  disabled={loading}
                  className="flex-1 py-3 text-base font-bold rounded-xl bg-primary hover:brightness-125 text-primary-foreground shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><Send className="w-4 h-4" /> Request a Callback</>}
                </button>
              </div>
            )}
            <p className="text-center text-xs text-primary mt-2">
              <Link href="/privacy" className="hover:underline">Privacy Policy</Link>{" "}|{" "}
              <Link href="/terms" className="hover:underline">Terms of Service</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExitIntentPopup;
