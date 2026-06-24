"use client";

import { useState, lazy, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, MessageCircle, Mail, Send, CheckCircle } from "lucide-react";
import { submitLead } from "@/lib/leads";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { toast } from "sonner";
import AddressAutocomplete from "@/components/AddressAutocomplete";

const Footer = lazy(() => import("@/components/Footer"));

const TOLL_FREE_TEXT = "(949) 875-7476";
const TOLL_FREE_TEXT_E164 = "+19498757476";
const TOLL_FREE_CALL = "(866) 407-3411";
const TOLL_FREE_CALL_E164 = "+18664073411";
const LOCAL_CALL = "(385)-259-1735";
const LOCAL_CALL_E164 = "+13852591735";

const PHONE_REGEX = /^\+?1?\d{10,14}$/;

export default function ContactPage() {
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consentTransactional, setConsentTransactional] = useState(false);
  const [consentPromotional, setConsentPromotional] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || !name || !phone) return;

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      toast.error("Name must be 2-100 characters");
      return;
    }

    const stripped = phone.replace(/[\s\-().]/g, "");
    if (!PHONE_REGEX.test(stripped)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      const recaptchaToken = await getRecaptchaToken("submit_lead");
      await submitLead(
        {
          name,
          phone: stripped,
          email: email || undefined,
          property_address: address,
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
    } catch {
      toast.error("Something went wrong. Please call us directly.");
    } finally {
      setLoading(false);
    }
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
            {email && " A welcome email is on the way."}
          </p>
        </div>
      );
    }

    return (
      <>
        <h3 className="text-lg font-bold text-foreground mb-1">Get Your Free Cash Offer</h3>
        <p className="text-sm text-muted-foreground mb-5">Fill in your details below to get started.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <AddressAutocomplete
            id="contact-address"
            value={address}
            onChange={setAddress}
            className="w-full h-14 text-base rounded-xl bg-secondary border border-border pl-12 pr-4 text-foreground placeholder:text-muted-foreground"
            required
            autoFocus
          />
          <label htmlFor="contact-name" className="sr-only">Your first name</label>
          <input id="contact-name" type="text" placeholder="Your first name" value={name} onChange={(e) => setName(e.target.value)} className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground" required />
          <label htmlFor="contact-phone" className="sr-only">Your phone number</label>
          <input id="contact-phone" type="tel" placeholder="Your phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground" required />
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
          <div className="space-y-3 mt-8 mb-8">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">SMS Consent</p>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="consent-transactional-contact"
                checked={consentTransactional}
                onChange={(e) => setConsentTransactional(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border shrink-0"
                required
              />
              <label htmlFor="consent-transactional-contact" className="text-[10px] leading-[14px] text-muted-foreground">
                I consent to receive non-marketing text messages from Tarek Buys Houses, LLC about appointment confirmations and property follow-up communications. Message frequency may vary. Message &amp; data rates may apply. Text HELP for assistance, reply STOP to opt out.
              </label>
            </div>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="consent-promotional-contact"
                checked={consentPromotional}
                onChange={(e) => setConsentPromotional(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border shrink-0"
              />
              <label htmlFor="consent-promotional-contact" className="text-[10px] leading-[14px] text-muted-foreground">
                I consent to receive marketing text messages, about special offers, new listings, and market updates, from Tarek Buys Houses, LLC at the phone number provided. Message frequency may vary. Message &amp; data rates may apply. Text HELP for assistance, reply STOP to opt out.
              </label>
            </div>
            <p className="text-[10px] leading-[14px] text-muted-foreground">(SMS checkboxes are optional — you can still receive your cash offer without selecting any of the above)</p>
            <div className="flex items-start gap-2 mt-6">
              <input type="checkbox" id="privacy-terms-contact" className="mt-1 h-4 w-4 rounded border-border shrink-0" required />
              <label htmlFor="privacy-terms-contact" className="text-[10px] leading-[14px] text-muted-foreground">
                I agree to the <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a> and <a href="/terms" className="underline hover:text-foreground">Terms of Service</a>. I acknowledge that my mobile opt-in information and SMS consent will not be shared with third parties or affiliates for marketing or promotional purposes.
              </label>
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="w-full py-3.5 text-base font-bold rounded-xl bg-primary hover:brightness-110 text-primary-foreground shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            <Send className="w-4 h-4" />
            {loading ? "Submitting…" : "Get My Free Offer"}
          </button>
          <p className="text-center text-xs text-primary mt-1">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>{" "}|{" "}
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
          </p>
        </form>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                    <a href={`tel:${TOLL_FREE_CALL_E164}`} className="text-primary hover:underline">{TOLL_FREE_CALL}</a>
                    <span className="text-muted-foreground">|</span>
                    <a href={`tel:${LOCAL_CALL_E164}`} className="text-primary hover:underline">{LOCAL_CALL}</a>
                  </div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 flex-1 flex items-start">
                <div>
                  <MessageCircle className="w-5 h-5 text-primary mb-3" />
                  <h3 className="text-sm font-semibold text-foreground mb-1">Text Us</h3>
                  <a href={`sms:${TOLL_FREE_TEXT_E164}`} className="text-primary hover:underline text-sm">{TOLL_FREE_TEXT}</a>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 flex-1 flex items-start">
                <div>
                  <Mail className="w-5 h-5 text-primary mb-3" />
                  <h3 className="text-sm font-semibold text-foreground mb-1">Email Us</h3>
                  <a href="mailto:subscriptions@tarekbuyshouses.com" className="text-primary hover:underline text-sm break-all">subscriptions@tarekbuyshouses.com</a>
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
            <div id="cta-form" className="bg-card/90 backdrop-blur-md border border-border rounded-2xl p-6 shadow-2xl flex-1 flex flex-col">
              <div className="flex-1">
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
