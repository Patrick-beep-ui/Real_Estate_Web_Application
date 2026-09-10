"use client";

declare global {
  interface Window {
    grecaptcha: {
      ready(callback: () => void): void;
      execute(siteKey: string, options: { action: string }): Promise<string>;
    };
  }
}

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Shield, Send, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGeoMarket } from "@/hooks/geo/useGeoMarket";
import { validatePhone, validateEmail, stripPhone, formatPhoneDisplay, formatPriceDisplay } from "@/lib/leads/helpers";
import { submitLead, isLeadAddressError } from "@/lib/leads";
import { getRecaptchaToken } from "@/lib/tracking/recaptcha";
import { trackConversion } from "@/lib/tracking/analytics";
import { toast } from "sonner";
import { PHONE } from "@/lib/shared/phone";
import AddressAutocomplete from "@/components/leads/AddressAutocomplete";
import type { AddressMeta } from "@/components/leads/AddressAutocomplete";

const HomeLeadForm = ({
  source = "homepage",
  marketSlug,
  situationSlug,
}: {
  source?: string;
  marketSlug?: string;
  situationSlug?: string;
}) => {
  const router = useRouter();
  const geo = useGeoMarket();
  const isLanding = source !== "homepage";
  const [address, setAddress] = useState("");
  const [addressMeta, setAddressMeta] = useState<AddressMeta>({ canAdvance: false });
  const [addressError, setAddressError] = useState("");
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

  const canAdvanceFromStep1 = address.trim().length > 0 && addressMeta.canAdvance !== false;
  const canAdvanceFromStep2 = name.trim().length > 0 && phone.trim().length > 0;

  const detectedMarket = geo.market;

  const handleAddressChange = (value: string, meta: AddressMeta) => {
    const addressChanged = value !== address;
    setAddress(value);
    setAddressMeta(meta);
    if (addressChanged) setAddressError("");
  };

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
    const resolvedMarketSlug = marketSlug ?? detectedMarket?.slug ?? "national";
    const resolvedSituationSlug = situationSlug ?? (isLanding ? `landing-${resolvedMarketSlug}` : "home");
    try {
      const recaptchaToken = await getRecaptchaToken("submit_lead");
      await submitLead(
        {
          name,
          phone: stripPhone(phone),
          email: email || undefined,
          property_address: address,
          address_source: addressMeta.source || null,
          address_override: addressMeta.override ?? null,
          listed_with_agent: listedWithAgent || undefined,
          property_age: propertyAge || undefined,
          timeline_to_sell: timelineToSell || undefined,
          market_price: Number(marketPrice),
          lowest_price: Number(lowestPrice),
          market_slug: resolvedMarketSlug,
          situation_slug: resolvedSituationSlug,
          source,
          page_path: window.location.pathname,
          consent_transactional: consentTransactional,
          consent_promotional: consentPromotional,
        },
        recaptchaToken,
        idempotencyKey
      );
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({ event: "form_submitted" });
      if (isLanding) {
        trackConversion("form_submitted", { source, market: resolvedMarketSlug });
        router.push(
          `/landing/thank-you?market=${resolvedMarketSlug}&phone=${encodeURIComponent(PHONE.call)}`
        );
      } else {
        setFormSubmitted(true);
      }
    } catch (err) {
      if (isLeadAddressError(err)) {
        setAddressError((err as Error).message);
        setStep(1);
        return;
      }
      toast.error("Something went wrong. Please call us directly.");
    } finally {
      setLoading(false);
    }
  };

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
              onChange={handleAddressChange}
              errorText={addressError}
              className="w-full h-14 text-base rounded-xl bg-secondary border border-border pl-12 pr-4 text-foreground placeholder:text-muted-foreground"
              required
              autoFocus
            />
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canAdvanceFromStep1}
                className="px-6 py-3 text-sm font-bold rounded-xl bg-primary hover:brightness-125 text-primary-foreground transition-all disabled:opacity-40"
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
                className="px-6 py-3 text-sm font-bold rounded-xl bg-primary hover:brightness-125 text-primary-foreground transition-all disabled:opacity-40"
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
                className="flex-1 py-3 text-base font-bold rounded-xl bg-primary hover:brightness-125 text-primary-foreground shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
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
}

export default HomeLeadForm;