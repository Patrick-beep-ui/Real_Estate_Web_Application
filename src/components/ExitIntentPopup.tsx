import { useState, useEffect, useCallback, useRef } from "react";
import { X, Phone, Shield, Clock, Loader2, ArrowRight, MapPin, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageConfig } from "@/context/PageContext";
import { submitLead } from "@/lib/leads";
import { toast } from "sonner";
import { trackConversion } from "@/lib/analytics";

const PHONE_REGEX = /^\+?1?\d{10,14}$/;
const TAG = "[TBH:exit]";

const ExitIntentPopup = () => {
  const { phone, telLink, market, situation } = usePageConfig();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem("exit_popup_dismissed") === "true"; } catch { return false; }
  });
  const [step, setStep] = useState<1 | 2>(1);
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const mountTime = useRef(Date.now());
  const triggered = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (triggered.current || dismissed || submitted) return;
    if (Date.now() - mountTime.current < 30000) return;
    if (e.clientY > 0) return;
    triggered.current = true;
    console.log(`${TAG} ▶ Triggered via MOUSELEAVE after ${((Date.now() - mountTime.current) / 1000).toFixed(1)}s`);
    setShow(true);
  }, [dismissed, submitted]);

  useEffect(() => {
    if (dismissed || submitted || triggered.current) return;
    let maxScroll = 0;
    let scrollUpCount = 0;
    const handleScroll = () => {
      if (triggered.current || dismissed || submitted) return;
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
  }, [dismissed, submitted]);

  useEffect(() => {
    if (dismissed || submitted) return;
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    return () => document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
  }, [handleMouseLeave, dismissed, submitted]);

  useEffect(() => {
    if (!show) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = dialog.querySelectorAll<HTMLElement>('input, button, a, [tabindex]:not([tabindex="-1"])');
    if (focusable.length > 0) focusable[0].focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { close(); return; }
      if (e.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [show]);

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
    if (!name || !phoneInput || !consent) return;
    const stripped = phoneInput.replace(/[\s\-().]/g, "");
    if (!PHONE_REGEX.test(stripped)) { toast.error("Please enter a valid phone number"); return; }

    setLoading(true);
    const start = performance.now();
    try {
      await submitLead({
        name,
        phone: phoneInput,
        property_address: address || undefined,
        market_slug: market.slug,
        situation_slug: situation.slug,
        source: "exit_intent",
      });
      console.log(`${TAG} ✔ Lead submitted in ${(performance.now() - start).toFixed(0)}ms`);
      trackConversion("form_step_2", { source: "exit_intent", market: market.slug });
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again or call us directly.");
    } finally {
      setLoading(false);
    }
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={close} role="dialog" aria-modal="true" aria-label="Before you go — get a callback">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div ref={dialogRef} className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">We're Calling You Now</h3>
            <p className="text-muted-foreground text-sm">A member of Tarek's team will reach out within minutes.</p>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-background to-card p-6 pb-8 text-center">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Wait — Before You Go</p>
              <h3 className="text-2xl font-bold leading-tight mb-2 text-foreground">
                {step === 1 ? <>Get a Free <span className="text-primary">Cash Offer</span></> : <>Almost There!</>}
              </h3>
              <p className="text-muted-foreground text-sm">
                {step === 1 ? "Just enter your address — takes 10 seconds." : "Tell us how to reach you."}
              </p>
            </div>

            {step === 1 ? (
              <form onSubmit={handleStep1} className="p-6 space-y-4">
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
              <form onSubmit={handleStep2} className="p-6 space-y-4">
                <p className="text-xs text-muted-foreground truncate">📍 {address}</p>
                <div>
                  <label htmlFor="exit-name" className="sr-only">Your first name</label>
                  <input id="exit-name" type="text" placeholder="Your first name" value={name} onChange={(e) => setName(e.target.value)} className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground" required />
                </div>
                <div>
                  <label htmlFor="exit-phone" className="sr-only">Your phone number</label>
                  <input id="exit-phone" type="tel" placeholder="Your phone number" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} className="w-full h-12 text-base rounded-xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground" required />
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="tcpa-exit" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border shrink-0" required />
                  <label htmlFor="tcpa-exit" className="text-[10px] leading-[14px] text-muted-foreground">
                    By checking this box, I consent to receive calls, texts, and emails from Tarek Buys Houses at the number provided, including via automated technology and AI. Consent is not a condition of purchase. Msg & data rates may apply. Reply STOP to opt out.{" "}
                    <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link> ·{" "}
                    <Link to="/terms" className="underline hover:text-foreground">Terms</Link>
                  </label>
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 text-base font-bold rounded-xl bg-primary hover:brightness-110 text-primary-foreground shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><Send className="w-4 h-4" /> Request a Callback</>}
                </button>
                <button type="button" onClick={() => setStep(1)} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
                  ← Change address
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExitIntentPopup;
