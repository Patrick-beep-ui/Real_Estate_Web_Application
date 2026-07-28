"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Phone, CheckCircle, Clock, Star } from "lucide-react";
import { trackConversion } from "@/lib/analytics";
import PhoneLink from "@/components/PhoneLink";
import PhoneText from "@/components/PhoneText";
import { PHONE } from "@/lib/phone";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const market = searchParams.get("market") || "tampa";
  const phone = searchParams.get("phone") || PHONE.call;

  useEffect(() => {
    // Page-view tracking only — Google Ads conversion + Meta Lead are already
    // fired by submitLead() → trackLeadSubmission() before redirect. Firing
    // them here again would double-count every conversion.
    trackConversion("thank_you_page_view", { market });
  }, [market]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
          <CheckCircle className="h-10 w-10 text-primary" />
        </div>

        <h1 className="text-3xl font-extrabold text-foreground">
          We Got Your Info!
        </h1>

        <p className="text-lg text-muted-foreground">
          A member of Tarek's team will call you within <strong className="text-foreground">24 hours</strong> during business hours.
        </p>

        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 space-y-4">
          <p className="text-sm font-medium text-foreground">
            Want to speed things up?
          </p>
          <PhoneLink
            href={`tel:${phone.replace(/[^\d+]/g, "")}`}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-bold text-primary-foreground transition hover:bg-primary/90"
          >
            <Phone className="h-5 w-5" />
            Call Us Now
          </PhoneLink>
          <p className="text-sm text-muted-foreground">
            <PhoneText>{phone}</PhoneText>
          </p>
        </div>

        <div className="space-y-3 text-left rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground">What happens next:</h3>
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">We'll review your property details and prepare a fair cash offer</p>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">Our team calls you to discuss your offer — no obligation</p>
          </div>
          <div className="flex items-start gap-3">
            <Star className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">Accept and close on YOUR timeline — as fast as 7 days</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          As seen on HGTV's Flip or Flop · Tarek El Moussa's Team
        </p>
        
        <Link href="/" className="text-primary hover:underline text-sm">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function ThankYou() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  );
}
