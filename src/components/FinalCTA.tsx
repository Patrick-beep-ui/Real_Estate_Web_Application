"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { MessageCircle, Phone, Shield, CheckCircle, Send } from "lucide-react";
import { usePageConfig } from "@/context/PageContext";
import { submitLead } from "@/lib/leads";
import { validatePhone, validateEmail, stripPhone, formatPhoneDisplay } from "@/lib/leads/helpers";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { toast } from "sonner";
import { trackPhoneClick, trackSMSClick, trackConversion } from "@/lib/analytics";

const TAG = "[TBH:finalcta]";

const FinalCTA = () => {
  const { phone, smsLink, telLink, situation, market, text } = usePageConfig();
  const router = useRouter();
  const pathname = usePathname();
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
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [step, setStep] = useState(1);

  const canAdvanceFromStep1 = address.trim().length > 0;
  const canAdvanceFromStep2 = name.trim().length > 0 && phoneInput.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || !name || !phoneInput) return;

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      toast.error("Name must be 2-100 characters");
      return;
    }

    if (!validatePhone(phoneInput)) {
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
          source: "final_cta",
          page_path: pathname,
          consent_transactional: consentTransactional,
          consent_promotional: consentPromotional,
        },
        recaptchaToken,
        idempotencyKey,
      );
      console.log(`${TAG} ✔ Lead submitted in ${(performance.now() - start).toFixed(0)}ms`);
      trackConversion("form_submitted", { source: "final_cta", market: market.slug });
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again or call us directly.");
    } finally {
      setLoading(false);
    }
  };

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
          {s < 3 && <div className={`w-6 h-0.5 transition-colors ${s <= step ? "bg-primary" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );

  const consentSection = () => (
    <div className="space-y-3 mt-6 mb-6">
      <p className="text-xs font-semibold text-foreground uppercase tracking-wider">SMS Consent</p>
      <div className="flex items-start gap-2">
        <input type="checkbox" id="consent-transactional-final" checked={consentTransactional} onChange={(e) => setConsentTransactional(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border shrink-0" />
        <label htmlFor="consent-transactional-final" className="text-[9px] sm:text-[10px] leading-[13px] sm:leading-[14px] text-muted-foreground">
          I consent to receive non-marketing text messages from Tarek Buys Houses, LLC about appointment confirmations and property follow-up communications. Message frequency may vary. Message &amp; data rates may apply. Text HELP for assistance, reply STOP to opt out.
        </label>
      </div>
      <div className="flex items-start gap-2">
        <input type="checkbox" id="consent-promotional-final" checked={consentPromotional} onChange={(e) => setConsentPromotional(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border shrink-0" />
        <label htmlFor="consent-promotional-final" className="text-[9px] sm:text-[10px] leading-[13px] sm:leading-[14px] text-muted-foreground">
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

  return (
    <section id="final-cta" className="py-16 md:py-24 bg-background">
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
          ) : (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-6 space-y-3">
              <h3 className="text-lg font-bold text-foreground mb-1">Get Your Free Cash Offer</h3>
              <p className="text-sm text-muted-foreground mb-5">Enter your address and info to get started.</p>
              {stepIndicator()}
              {step === 1 && (
                <>
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Property Address</p>
                  <AddressAutocomplete
                    id="final-address"
                    value={address}
                    onChange={setAddress}
                    className="w-full h-14 text-base rounded-xl bg-secondary border border-border pl-12 pr-4 text-foreground placeholder:text-muted-foreground"
                    required
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
                  <label htmlFor="final-name" className="sr-only">Your first name</label>
                  <input id="final-name" type="text" placeholder="Your first name" value={name} onChange={(e) => setName(e.target.value)} className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground" required />
                  <label htmlFor="final-phone" className="sr-only">Your phone number</label>
                  <input id="final-phone" type="tel" placeholder="(555) 123-4567" value={phoneInput} onChange={(e) => setPhoneInput(formatPhoneDisplay(e.target.value))} className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground" required />
                  <div>
                    <label htmlFor="final-email" className="sr-only">Email (optional)</label>
                    <input
                      id="final-email"
                      type="email"
                      placeholder="Email (optional — for offer updates)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                    id="final-timeline"
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
                    id="final-listed"
                    value={listedWithAgent}
                    onChange={(e) => setListedWithAgent(e.target.value)}
                    className={`w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 ${!listedWithAgent ? "text-muted-foreground" : "text-foreground"}`}
                  >
                    <option value="">Is the property currently listed with a real estate agent?</option>
                    <option value="Listed">Listed</option>
                    <option value="Unlisted">Unlisted</option>
                  </select>
                  <select
                    id="final-age"
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
                      disabled={loading}
                      className="flex-1 py-3 text-base font-bold rounded-xl bg-primary hover:brightness-110 text-primary-foreground shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <Send className="w-4 h-4" />
                      {loading ? "Submitting…" : "Get My Free Offer"}
                    </button>
                  </div>
                </>
              )}
              {step === 1 && (
                <p className="text-center text-xs text-primary mt-1">
                  <Link href="/privacy" className="hover:underline">Privacy Policy</Link>{" "}|{" "}
                  <Link href="/terms" className="hover:underline">Terms of Service</Link>
                </p>
              )}
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
