"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Send, CheckCircle, Shield } from "lucide-react";
import { submitLead } from "@/lib/leads";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { toast } from "sonner";

const PHONE_REGEX = /^\+?1?\d{10,14}$/;

export default function SMSOptIn() {
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consentTransactional, setConsentTransactional] = useState(false);
  const [consentPromotional, setConsentPromotional] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
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
          property_address: address || undefined,
          market_slug: "national",
          situation_slug: "home",
          source: "sms-opt-in",
          page_path: window.location.pathname,
        },
        recaptchaToken
      );
      setFormSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please call us directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-2">SMS Opt-In Disclosure</h1>
        <p className="text-muted-foreground text-sm mb-10">Tarek Buys Houses, LLC — SMS Messaging Program</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_strong]:text-foreground">

          <p>
            When you submit a property inquiry on <Link href="/" className="text-primary hover:underline">tarekbuyshouses.com</Link>, you
            may opt in to receive SMS text messages from Tarek Buys Houses, LLC. This page describes the
            terms of that program.
          </p>

          <h2>Program Description</h2>
          <p>
            Tarek Buys Houses, LLC operates an SMS messaging program to communicate with homeowners who
            have submitted an inquiry about receiving a cash offer on their property. Messages may include
            offer details and updates, appointment confirmations, property status notifications, and
            customer care communications.
          </p>

          <h2>Submit Your Inquiry &amp; Opt In</h2>
          <p>
            Fill out the form below to request a cash offer and manage your SMS consent preferences.
            All SMS checkboxes are <strong>unchecked by default and entirely optional</strong> — you
            can still receive your cash offer without selecting any of them.
          </p>

          {/* ── Live Form ── */}
          <div className="not-prose border border-border rounded-xl p-6 bg-card/50">
            {formSubmitted ? (
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
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Address */}
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <label htmlFor="soi-address" className="sr-only">Property Address</label>
                  <input
                    id="soi-address"
                    type="text"
                    placeholder="Property address (optional)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full h-12 text-base rounded-xl bg-secondary border border-border pl-12 pr-4 text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                {/* Name */}
                <label htmlFor="soi-name" className="sr-only">Your first name</label>
                <input
                  id="soi-name"
                  type="text"
                  placeholder="Your first name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground"
                  required
                />

                {/* Phone */}
                <label htmlFor="soi-phone" className="sr-only">Your phone number</label>
                <input
                  id="soi-phone"
                  type="tel"
                  placeholder="Your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground"
                  required
                />

                {/* Email */}
                <label htmlFor="soi-email" className="sr-only">Email (optional)</label>
                <input
                  id="soi-email"
                  type="email"
                  placeholder="Email (optional — for offer updates)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground"
                />

                {/* SMS Consent */}
                <div className="space-y-3 mt-6 mb-6">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider">SMS Consent</p>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="soi-consent-transactional"
                      checked={consentTransactional}
                      onChange={(e) => setConsentTransactional(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-border shrink-0"
                    />
                    <label htmlFor="soi-consent-transactional" className="text-[10px] leading-[14px] text-muted-foreground">
                      I consent to receive non-marketing text messages from Tarek Buys Houses, LLC about cash offer updates, appointment confirmations, and property follow-up communications. Message frequency may vary. Msg &amp; data rates may apply. Text HELP for assistance, reply STOP to opt out.
                    </label>
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="soi-consent-promotional"
                      checked={consentPromotional}
                      onChange={(e) => setConsentPromotional(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-border shrink-0"
                    />
                    <label htmlFor="soi-consent-promotional" className="text-[10px] leading-[14px] text-muted-foreground">
                      I consent to receive marketing text messages about special offers, new listings, and market updates from Tarek Buys Houses, LLC at the phone number provided. Message frequency may vary. Msg &amp; data rates may apply. Text HELP for assistance, reply STOP to opt out.
                    </label>
                  </div>

                  <p className="text-[10px] leading-[14px] text-muted-foreground">(SMS checkboxes are optional — you can still receive your cash offer without selecting any of the above)</p>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="soi-consent-privacy"
                      checked={consentPrivacy}
                      onChange={(e) => setConsentPrivacy(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-border shrink-0"
                      required
                    />
                    <label htmlFor="soi-consent-privacy" className="text-[10px] leading-[14px] text-muted-foreground">
                      I agree to the{" "}
                      <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link> and{" "}
                      <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link>. I acknowledge that my mobile opt-in information and SMS consent will not be shared with third parties or affiliates for marketing or promotional purposes.
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 text-base font-bold rounded-xl bg-primary hover:brightness-110 text-primary-foreground shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  {loading ? "Submitting…" : "Get My Free Offer"}
                </button>

                <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Private</span>
                  <span>·</span><span>No Obligation</span><span>·</span><span>Free</span>
                </div>
              </form>
            )}
          </div>

          <h2>Message Frequency &amp; Rates</h2>
          <p>
            Message frequency varies based on your inquiry and opt-in selections. Standard message and
            data rates may apply depending on your mobile carrier plan.
          </p>

          <h2>How to Opt Out</h2>
          <p>
            You may opt out of SMS communications at any time by replying <strong>STOP</strong> to any
            message from us. After replying STOP, you will receive one final confirmation text and will
            not receive further messages from that campaign. To re-subscribe, reply <strong>START</strong>.
          </p>

          <h2>Need Help?</h2>
          <p>
            Reply <strong>HELP</strong> to any message for assistance, or contact us directly:
          </p>
          <ul>
            <li>Email: <a href="mailto:privacy@tarekbuyshouses.com" className="text-primary hover:underline">privacy@tarekbuyshouses.com</a></li>
            <li>Phone: <a href="tel:+18664073411" className="text-primary hover:underline">(866) 407-3411</a></li>
          </ul>
          <p>Carriers are not liable for delayed or undelivered messages.</p>

          <h2>No Sharing of SMS Opt-In Data</h2>
          <p>
            SMS opt-in consent and phone numbers collected for the purpose of SMS communications are
            never sold, shared, rented, or transferred to any third party or affiliate for their own
            marketing or promotional purposes. This data is used exclusively by Tarek Buys Houses, LLC
            to communicate with the individual who provided consent.
          </p>

          <h2>Age Restriction</h2>
          <p>
            This SMS program is intended solely for individuals 18 years of age or older. By opting in,
            you represent that you meet this requirement.
          </p>

          <div className="border-t border-border pt-6 mt-8">
            <p className="text-xs text-muted-foreground">
              For full details, see our{" "}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and{" "}
              <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link> (Section 12 — SMS Messaging Terms).
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
