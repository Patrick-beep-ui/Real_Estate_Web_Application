"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Cookie } from "lucide-react";
import { getConsentLevel, hasAnalyticsConsent } from "@/lib/tracking/consent";

export { getConsentLevel, hasAnalyticsConsent };

const CookieConsent = () => {
  const [show, setShow] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("cookie_consent")) {
        const timer = setTimeout(() => setShow(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const accept = (level: "all" | "essential") => {
    try { localStorage.setItem("cookie_consent", level); } catch {}
    setShow(false);
    window.dispatchEvent(new CustomEvent("cookie_consent_change", { detail: { level } }));
  };

  if (!show) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-6 right-4 z-[80] max-w-sm animate-in slide-in-from-bottom-4 duration-300"
      role="dialog"
      aria-label="Cookie preferences"
      aria-modal="false"
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-5">
        <div className="flex items-start gap-3 mb-3">
          
          <div>
            <div className="flex mb-2">
              <Cookie className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <h3 className="text-sm font-bold text-foreground mt-1 ml-2">Cookie Preferences</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              We use cookies to improve your experience and analyze site traffic. Essential cookies are required for the site to function. Your
              choice here controls optional site analytics only — advertising attribution and conversion measurement continue regardless.{" "}
              <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>
            </p>
          </div>
          <button onClick={() => accept("essential")} className="text-muted-foreground hover:text-foreground shrink-0" aria-label="Dismiss cookie banner">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => accept("all")}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:brightness-125 transition-all"
          >
            Allow Site Analytics
          </button>
          <button
            onClick={() => accept("essential")}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-all"
          >
            Essentials Cookies Only
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-2 py-2 text-xs text-muted-foreground underline hover:text-foreground transition-all cursor-pointer"
          >
            Cookie Details
          </button>
        </div>

        {showDetails && (
          <div className="mt-3 pt-3 border-t border-border space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span className="font-semibold">Essential</span>
              <span className="text-green-check">Always Active</span>
            </div>
            <p>Required for the site to function. Cannot be disabled.</p>
            <div className="flex justify-between mt-2">
              <span className="font-semibold">Site Analytics</span>
              <span>Optional</span>
            </div>
            <p>
              Help us understand how visitors use the site. Declining turns off Google Analytics only. Advertising attribution and conversion
              measurement are not affected by this choice.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieConsent;
