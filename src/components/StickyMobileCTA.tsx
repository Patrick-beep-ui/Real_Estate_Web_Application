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
import { Phone, Send, X, ChevronUp } from "lucide-react";
import { usePageConfig } from "@/context/PageContext";
import { submitLead } from "@/lib/leads";
import { getRecaptchaToken } from "@/lib/recaptcha";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { toast } from "sonner";
import { trackPhoneClick, trackConversion } from "@/lib/analytics";

const PHONE_REGEX = /^\+?1?\d{10,14}$/;
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
  const [consentTransactional, setConsentTransactional] = useState(false);
  const [consentPromotional, setConsentPromotional] = useState(false);
  const [loading, setLoading] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    console.log(`${TAG} expanded=${expanded}`);
    window.dispatchEvent(new CustomEvent("sticky_cta_state", { detail: { expanded } }));
  }, [expanded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || !name || !phoneVal) return;

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
          property_address: address,
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

          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="relative">
              <AddressAutocomplete
                id="sticky-address"
                value={address}
                onChange={setAddress}
                className="w-full h-10 rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
                iconClassName="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              />
            </div>
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
            <div className="space-y-3 mt-8 mb-8">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">SMS Consent</p>
              <div className="flex items-start gap-2">
                <input type="checkbox" id="consent-transactional-sticky" checked={consentTransactional} onChange={(e) => setConsentTransactional(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border shrink-0" required />
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
                <input type="checkbox" id="privacy-terms-sticky" className="mt-1 h-4 w-4 rounded border-border shrink-0" required />
                <label htmlFor="privacy-terms-sticky" className="text-[9px] sm:text-[10px] leading-[13px] sm:leading-[14px] text-muted-foreground">
                  I agree to the <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a> and <a href="/terms" className="underline hover:text-foreground">Terms of Service</a>. I acknowledge that my mobile opt-in information and SMS consent will not be shared with third parties or affiliates for marketing or promotional purposes.
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading || !name || !phoneVal} className="flex-1 flex items-center justify-center gap-2 h-10 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm disabled:opacity-50 active:opacity-90 transition-opacity">
                <Send className="w-4 h-4" /> {loading ? "Sending…" : "Submit"}
              </button>
              <a href={telLink} onClick={() => trackPhoneClick(market.slug, situation.slug)} className="flex items-center justify-center gap-1 h-10 px-3 rounded-md border border-input text-muted-foreground text-sm hover:text-foreground transition-colors" aria-label={`Call us at ${phone}`}>
                <Phone className="w-4 h-4" /> Call
              </a>
            </div>
            <p className="text-center text-xs text-primary mt-1">
              <a href="/privacy" className="hover:underline">Privacy Policy</a>{" "}|{" "}
              <a href="/terms" className="hover:underline">Terms of Service</a>
            </p>
          </form>
        </div>
      )}
    </div>
  );
};

export default StickyMobileCTA;
