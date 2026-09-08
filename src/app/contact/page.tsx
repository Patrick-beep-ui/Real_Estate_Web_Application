"use client";

import { useState, lazy, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, MessageCircle, Mail, Send, CheckCircle } from "lucide-react";
import { submitLead, isLeadAddressError } from "@/lib/leads";
import { validatePhone, validateEmail, stripPhone, formatPhoneDisplay } from "@/lib/leads/helpers";
import { getRecaptchaToken } from "@/lib/tracking/recaptcha";
import { toast } from "sonner";
import AddressAutocomplete from "@/components/leads/AddressAutocomplete";
import type { AddressMeta } from "@/components/leads/AddressAutocomplete";
import PhoneLink from "@/components/shared/PhoneLink";
import { PHONE, buildTelLink, buildSmsLink } from "@/lib/shared/phone";
import { CONTACT_EMAIL, buildMailtoLink } from "@/lib/shared/contact";

const Footer = lazy(() => import("@/components/layout/Footer"));





export default function ContactPage() {
  const [address, setAddress] = useState("");
  const [addressMeta, setAddressMeta] = useState<AddressMeta>({ canAdvance: false });
  const [addressError, setAddressError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [timelineToSell, setTimelineToSell] = useState("");
  const [listedWithAgent, setListedWithAgent] = useState("");
  const [propertyAge, setPropertyAge] = useState("");
  const [consentTransactional, setConsentTransactional] = useState(false);
  const [consentPromotional, setConsentPromotional] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [step, setStep] = useState(1);

  const canAdvanceFromStep1 = address.trim().length > 0 && addressMeta.canAdvance !== false;
  const canAdvanceFromStep2 = name.trim().length > 0 && phone.trim().length > 0;

  const handleAddressChange = (value: string, meta: AddressMeta) => {
    setAddress(value);
    setAddressMeta(meta);
    setAddressError("");
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

    setLoading(true);
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
          market_slug: "national",
          situation_slug: "contact",
          source: "contact_page",
          page_path: typeof window !== "undefined" ? window.location.pathname : "/contact",
          consent_transactional: consentTransactional,
          consent_promotional: consentPromotional,
        },
        recaptchaToken,
        idempotencyKey
      );
      setFormSubmitted(true);
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({ event: "form_submitted" });
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

  const renderForm = () => {
    if (formSubmitted) {
      return (
        <div className="text-center flex flex-col justify-center flex-1 py-6">
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

    return (
      <>
        <h3 className="text-lg font-bold text-foreground mb-1">Get Your Free Cash Offer</h3>
        <p className="text-sm text-muted-foreground mb-5">Fill in your details below to get started.</p>
        {(() => {
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

          const consentSection = () => (
            <div className="space-y-3 mt-6 mb-6">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">SMS Consent</p>
              <div className="flex items-start gap-2">
                <input type="checkbox" id="consent-transactional-contact" checked={consentTransactional} onChange={(e) => setConsentTransactional(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border shrink-0" />
                <label htmlFor="consent-transactional-contact" className="text-[10px] leading-[14px] text-muted-foreground">
                  I consent to receive non-marketing text messages from Tarek Buys Houses, LLC about appointment confirmations and property follow-up communications. Message frequency may vary. Message &amp; data rates may apply. Text HELP for assistance, reply STOP to opt out.
                </label>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" id="consent-promotional-contact" checked={consentPromotional} onChange={(e) => setConsentPromotional(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border shrink-0" />
                <label htmlFor="consent-promotional-contact" className="text-[10px] leading-[14px] text-muted-foreground">
                  I consent to receive marketing text messages, about special offers, new listings, and market updates, from Tarek Buys Houses, LLC at the phone number provided. Message frequency may vary. Message &amp; data rates may apply. Text HELP for assistance, reply STOP to opt out.
                </label>
              </div>
              <p className="text-[10px] leading-[14px] text-muted-foreground">(SMS checkboxes are optional — you can still receive your cash offer without selecting any of the above)</p>
              <div className="flex items-start gap-2 mt-6">
                <input type="checkbox" id="privacy-terms-contact" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border shrink-0" required />
                <label htmlFor="privacy-terms-contact" className="text-[9px] sm:text-[10px] leading-[13px] sm:leading-[14px] text-muted-foreground">
                  I agree to the <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a> and <a href="/terms" className="underline hover:text-foreground">Terms of Service</a>. I acknowledge that my mobile opt-in information and SMS consent will not be shared with third parties or affiliates for marketing or promotional purposes.
                </label>
              </div>
            </div>
          );

          return (
            <>
              {stepIndicator()}
              <form onSubmit={handleSubmit} className="space-y-3">
                {step === 1 && (
                  <>
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Property Address</p>
                    <AddressAutocomplete
                      id="contact-address"
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
                    <label htmlFor="contact-name" className="sr-only">Your first name</label>
                    <input id="contact-name" type="text" placeholder="Your first name" value={name} onChange={(e) => setName(e.target.value)} className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground" required />
                    <label htmlFor="contact-phone" className="sr-only">Your phone number</label>
                    <input id="contact-phone" type="tel" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(formatPhoneDisplay(e.target.value))} className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground" required />
                    <div>
                      <label htmlFor="contact-email" className="sr-only">Email (optional)</label>
                      <input
                        id="contact-email"
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
                      id="contact-timeline"
                      value={timelineToSell}
                      onChange={(e) => setTimelineToSell(e.target.value)}
                      className={`w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 ${!timelineToSell ? "text-muted-foreground" : "text-foreground"}`}
                    >
                      <option value="">How soon are you looking to sell?</option>
                      <option value="ASAP (within 30 days)">ASAP (within 30 days)</option>
                      <option value="1–3 months">1–3 months</option>
                      <option value="3–6 months">3–6 months</option>
                      <option value="Just exploring my options">Just exploring my options</option>
                    </select>
                    <select
                      id="contact-listed"
                      value={listedWithAgent}
                      onChange={(e) => setListedWithAgent(e.target.value)}
                      className={`w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 ${!listedWithAgent ? "text-muted-foreground" : "text-foreground"}`}
                    >
                      <option value="">Is the property currently listed with a real estate agent?</option>
                      <option value="Listed">Listed</option>
                      <option value="Unlisted">Unlisted</option>
                    </select>
                    <select
                      id="contact-age"
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
                        className="flex-1 py-3 text-base font-bold rounded-xl bg-primary hover:brightness-125 text-primary-foreground shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        <Send className="w-4 h-4" />
                        {loading ? "Submitting…" : "Get My Free Offer"}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </>
          );
        })()}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col h-full">
            <h1 className="text-3xl font-extrabold mb-4">Contact Us</h1>
            <p className="text-muted-foreground text-base mb-10">
              Have a property you need to sell? Reach out by filling out the form, calling, or texting us—Tarek&rsquo;s team is ready to make you a fair cash offer, with no repairs required and no obligation.
            </p>

            <div className="flex flex-col gap-4 flex-1">
              <div className="bg-card border border-border rounded-2xl p-5 flex-1 flex items-start">
                <div>
                  <Phone className="w-5 h-5 text-primary mb-3" />
                  <h3 className="text-sm font-semibold text-foreground mb-1">Call Us</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <PhoneLink href={buildTelLink()} className="text-primary hover:underline">{PHONE.call}</PhoneLink>
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 flex-1 flex items-start">
                <div>
                  <MessageCircle className="w-5 h-5 text-primary mb-3" />
                  <h3 className="text-sm font-semibold text-foreground mb-1">Text Us</h3>
                  <PhoneLink href={buildSmsLink(PHONE.textE164, "")} className="text-primary hover:underline text-sm">{PHONE.text}</PhoneLink>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 flex-1 flex items-start">
                <div>
                  <Mail className="w-5 h-5 text-primary mb-3" />
                  <h3 className="text-sm font-semibold text-foreground mb-1">Email Us</h3>
                  <a href={buildMailtoLink()} className="text-primary hover:underline text-sm break-all">{CONTACT_EMAIL}</a>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 flex-1 flex items-start">
                <div>
                  <MapPin className="w-5 h-5 text-primary mb-3" />
                  <h3 className="text-sm font-semibold text-foreground mb-1">Address</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    4411 E La Palma Ave<br />
                    Anaheim, CA 92807<br />
                    United States
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:pt-16 h-full">
            <h2 className="text-xl font-bold text-foreground mb-6">Send Us a Message</h2>
            <div id="cta-form" className={`bg-card/90 backdrop-blur-md border border-border rounded-2xl p-6 shadow-2xl ${step === 1 && !formSubmitted ? '' : 'flex-1'} flex flex-col`}>
              <div className="flex-1 flex flex-col">
                {renderForm()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
