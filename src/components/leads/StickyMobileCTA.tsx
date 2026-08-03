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
import { Phone, Send, X, ChevronUp, DollarSign } from "lucide-react";
import { usePageConfig } from "@/context/PageContext";
import { submitLead } from "@/lib/leads";
import { validatePhone, validateEmail, stripPhone, formatPhoneDisplay, formatPriceDisplay } from "@/lib/leads/helpers";
import { getRecaptchaToken } from "@/lib/recaptcha";
import AddressAutocomplete from "@/components/leads/AddressAutocomplete";
import { toast } from "sonner";
import { trackPhoneClick, trackConversion } from "@/lib/analytics";
import PhoneLink from "@/components/shared/PhoneLink";

const TAG = "[TBH:sticky]";

const StickyMobileCTA = () => {
  const { phone, telLink, market, situation } = usePageConfig();
  const router = useRouter();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [phoneVal, setPhoneVal] = useState("");
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
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [step, setStep] = useState(1);

  const canAdvanceFromStep1 = address.trim().length > 0;
  const canAdvanceFromStep2 = name.trim().length > 0 && phoneVal.trim().length > 0;

  const stepIndicator = () => (
    <div className="flex items-center justify-center gap-1 mb-3">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center gap-1">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
              s <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {s}
          </div>
          {s < 3 && <div className={`w-5 h-0.5 transition-colors ${s <= step ? "bg-primary" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );

  const consentSection = () => (
    <div className="space-y-2 mt-4 mb-4">
      <p className="text-xs font-semibold text-foreground uppercase tracking-wider">SMS Consent</p>
      <div className="flex items-start gap-2">
        <input type="checkbox" id="consent-transactional-sticky" checked={consentTransactional} onChange={(e) => setConsentTransactional(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border shrink-0" required/>
        <label htmlFor="consent-transactional-sticky" className="text-[9px] sm:text-[10px] leading-[13px] sm:leading-[14px] text-muted-foreground">
          I consent to receive non-marketing text messages from Tarek Buys Houses, LLC about appointment confirmations and property follow-up communications. Message frequency may vary. Message &amp; data rates may apply. Text HELP for assistance, reply STOP to opt out.
        </label>
      </div>
      <div className="flex items-start gap-2">
        <input type="checkbox" id="consent-promotional-sticky" checked={consentPromotional} onChange={(e) => setConsentPromotional(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border shrink-0" />
        <label htmlFor="consent-promotional-sticky" className="text-[9px] sm:text-[10px] leading-[13px] sm:leading-[14px] text-muted-foreground">
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

  useEffect(() => {
    console.log(`${TAG} expanded=${expanded}`);
    window.dispatchEvent(new CustomEvent("sticky_cta_state", { detail: { expanded } }));
  }, [expanded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || !name || !phoneVal) return;

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      toast.error("Name must be 2-100 characters");
      return;
    }

    if (!validatePhone(phoneVal)) {
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
    const start = performance.now();
    try {
      const recaptchaToken = await getRecaptchaToken("submit_lead");
      await submitLead(
        {
          name,
          phone: stripPhone(phoneVal),
          email: email || undefined,
          property_address: address,
          listed_with_agent: listedWithAgent || undefined,
          property_age: propertyAge || undefined,
          timeline_to_sell: timelineToSell || undefined,
          market_price: Number(marketPrice),
          lowest_price: Number(lowestPrice),
          market_slug: market.slug,
          situation_slug: situation.slug,
          source: "sticky_mobile",
          page_path: pathname,
          consent_transactional: consentTransactional,
          consent_promotional: consentPromotional,
        },
        recaptchaToken,
        idempotencyKey,
      );
      console.log(`${TAG} ✔ Lead submitted in ${(performance.now() - start).toFixed(0)}ms`);
      trackConversion("form_submitted", { source: "sticky_mobile", market: market.slug });
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
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm active:opacity-90 transition-opacity"
        >
          <ChevronUp className="w-4 h-4" aria-hidden="true" />
          Get Your Free Cash Offer
        </button>
      ) : (
        <div className="px-4 pt-3 pb-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-foreground">Get Your Free Cash Offer</span>
            <button onClick={() => setExpanded(false)} className="p-1 rounded-full text-muted-foreground hover:text-foreground" aria-label="Close form">
              <X className="w-4 h-4" />
            </button>
          </div>

          {stepIndicator()}
          <form onSubmit={handleSubmit} className="space-y-2">
            {step === 1 && (
              <>
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Property Address</p>
                <div className="relative">
                  <AddressAutocomplete
                    id="sticky-address"
                    value={address}
                    onChange={setAddress}
                    className="w-full h-10 rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                    autoFocus
                    iconClassName="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!canAdvanceFromStep1}
                    className="flex-1 h-10 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm disabled:opacity-50 active:opacity-90 transition-opacity"
                  >
                    Next →
                  </button>
                  <PhoneLink href={telLink} onClick={() => trackPhoneClick(market.slug, situation.slug)} className="flex items-center justify-center gap-1 h-10 px-3 rounded-md border border-input text-muted-foreground text-sm hover:text-foreground transition-colors" aria-label={`Call us at ${phone}`}>
                    <Phone className="w-4 h-4" /> Call
                  </PhoneLink>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Your Information</p>
                <div>
                  <label htmlFor="sticky-name" className="sr-only">Your Name</label>
                  <input id="sticky-name" type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label htmlFor="sticky-phone" className="sr-only">Phone Number</label>
                  <input id="sticky-phone" type="tel" placeholder="(555) 123-4567" value={phoneVal} onChange={(e) => setPhoneVal(formatPhoneDisplay(e.target.value))} required className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label htmlFor="sticky-email" className="sr-only">Email (optional)</label>
                  <input id="sticky-email" type="email" placeholder="Email (optional — for offer updates)" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 h-10 rounded-md border border-input text-foreground font-bold text-sm hover:bg-secondary transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!canAdvanceFromStep2}
                    className="flex-1 h-10 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm disabled:opacity-50 active:opacity-90 transition-opacity"
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
                  id="sticky-timeline"
                  value={timelineToSell}
                  onChange={(e) => setTimelineToSell(e.target.value)}
                  className={`w-full h-9 rounded-md border border-input bg-background px-3 text-sm ${!timelineToSell ? "text-muted-foreground" : "text-foreground"} focus:outline-none focus:ring-2 focus:ring-ring`}
                >
                  <option value="">How soon are you looking to sell?</option>
                  <option value="ASAP (within 30 days)">ASAP (within 30 days)</option>
                  <option value="1–3 months">1–3 months</option>
                  <option value="3–6 months">3–6 months</option>
                  <option value="6-12 months">6-12 months</option>
                  <option value="Just exploring my options">Just exploring my options</option>
                </select>
                <select
                  id="sticky-listed"
                  value={listedWithAgent}
                  onChange={(e) => setListedWithAgent(e.target.value)}
                  className={`w-full h-9 rounded-md border border-input bg-background px-3 text-sm ${!listedWithAgent ? "text-muted-foreground" : "text-foreground"} focus:outline-none focus:ring-2 focus:ring-ring`}
                >
                  <option value="">Is the property currently listed with a real estate agent?</option>
                  <option value="Listed">Listed</option>
                  <option value="Unlisted">Unlisted</option>
                </select>
                <select
                  id="sticky-age"
                  value={propertyAge}
                  onChange={(e) => setPropertyAge(e.target.value)}
                  className={`w-full h-9 rounded-md border border-input bg-background px-3 text-sm ${!propertyAge ? "text-muted-foreground" : "text-foreground"} focus:outline-none focus:ring-2 focus:ring-ring`}
                >
                  <option value="">About how old is the home?</option>
                  <option value="20+ Years Old">20+ Years Old</option>
                  <option value="10-19 Years Old">10-19 Years Old</option>
                  <option value="5 to 9 Years Old">5 to 9 Years Old</option>
                  <option value="3-4 Years Old">3-4 Years Old</option>
                  <option value="1-2 Years Old">1-2 Years Old</option>
                </select>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 h-10 rounded-md border border-input text-foreground font-bold text-sm hover:bg-secondary transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="flex-1 h-10 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm active:opacity-90 transition-opacity"
                  >
                    Next →
                  </button>
                </div>
              </>
            )}
            {step === 4 && (
              <>
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Property Value</p>
                <p className="text-xs text-muted-foreground mb-1">Help us understand your property's value.</p>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="sticky-market-price"
                    type="text"
                    inputMode="numeric"
                    placeholder="Estimated market value (required)"
                    value={formatPriceDisplay(Number(marketPrice) || 0)}
                    onChange={(e) => setMarketPrice(e.target.value.replace(/[^0-9Kk]/g, ""))}
                    onBlur={() => {
                      const num = Number(marketPrice);
                      if (num > 0 && num < 1000) setMarketPrice(String(num * 1000));
                    }}
                    className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="sticky-lowest-price"
                    type="text"
                    inputMode="numeric"
                    placeholder="Lowest price you'd accept (required)"
                    value={formatPriceDisplay(Number(lowestPrice) || 0)}
                    onChange={(e) => setLowestPrice(e.target.value.replace(/[^0-9Kk]/g, ""))}
                    onBlur={() => {
                      const num = Number(lowestPrice);
                      if (num > 0 && num < 1000) setLowestPrice(String(num * 1000));
                    }}
                    className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
                {consentSection()}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 h-10 rounded-md border border-input text-foreground font-bold text-sm hover:bg-secondary transition-colors"
                  >
                    ← Back
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 h-10 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm disabled:opacity-50 active:opacity-90 transition-opacity">
                    <Send className="w-4 h-4" /> {loading ? "Sending…" : "Submit"}
                  </button>
                  <PhoneLink href={telLink} onClick={() => trackPhoneClick(market.slug, situation.slug)} className="flex items-center justify-center gap-1 h-10 px-3 rounded-md border border-input text-muted-foreground text-sm hover:text-foreground transition-colors" aria-label={`Call us at ${phone}`}>
                    <Phone className="w-4 h-4" /> Call
                  </PhoneLink>
                </div>
              </>
            )}
            {step === 1 && (
              <p className="text-center text-xs text-primary mt-1">
                <a href="/privacy" className="hover:underline">Privacy Policy</a>{" "}|{" "}
                <a href="/terms" className="hover:underline">Terms of Service</a>
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default StickyMobileCTA;
