"use client";

import { useEffect, useState } from "react";
import { Home, PhoneCall, Calculator, KeyRound, Clock, MapPin, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: Home,
    tag: "Step 1",
    title: "Tell Us About Your Property",
    desc: "Share your address and a few basic details — online, by text, or by phone. Takes about 60 seconds.",
  },
  {
    icon: PhoneCall,
    tag: "Step 2",
    title: "We Call You Within 24 Hours",
    desc: "We research your property and the local market, then call with a fair, no-obligation cash offer. No inspections, no appraisals, no waiting.",
  },
  {
    icon: Calculator,
    tag: "Step 3",
    title: "Review a Transparent Offer",
    desc: "We walk you through exactly how we got your number — comparable sales, minus repairs, minus our margin. No hidden fees, no pressure to accept.",
  },
  {
    icon: KeyRound,
    tag: "Step 4",
    title: "Close On Your Timeline",
    desc: "Pick your date — 7, 14, or 30 days. We pay all closing costs through a licensed third-party title company. You walk away with cash.",
  },
] as const;

const AUTO_ADVANCE_MS = 6000;

function PreviewContent({ stepIndex }: { stepIndex: number }) {
  switch (stepIndex) {
    case 0:
      return (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground mb-1">Property Address</div>
          <div className="bg-background border border-border rounded-xl px-4 py-3 text-sm flex items-center justify-between">
            <span>123 Maple Street, Anaheim, CA</span>
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground">Full Name</div>
            <div className="bg-background border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground">Phone Number</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-primary font-semibold pt-2">
            <Clock className="w-3.5 h-3.5" /> Takes about 60 seconds
          </div>
        </div>
      );
    case 1:
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <PhoneCall className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Incoming call</div>
              <div className="text-xs text-muted-foreground">Tarek Buys Houses Team</div>
            </div>
            <span className="text-xs text-primary font-bold flex-shrink-0">Live</span>
          </div>
          <div className="bg-background border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground leading-relaxed">
            "Hi — we looked at comps in your area and we're ready to make you a cash offer today."
          </div>
          <div className="flex items-center gap-2 text-xs text-primary font-semibold pt-1">
            <Clock className="w-3.5 h-3.5" /> Within 24 hours of your request
          </div>
        </div>
      );
    case 2:
      return (
        <div>
          <div className="space-y-0">
            {[
              { label: "After Repair Value", val: "$320,000" },
              { label: "Repair Costs", val: "– $45,000" },
              { label: "Our Margin", val: "– $35,000" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm py-2.5 border-b border-border/50">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-semibold">{row.val}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-4">
            <span className="font-bold">Your Cash Offer</span>
            <span className="text-2xl font-extrabold text-primary">$240,000</span>
          </div>
        </div>
      );
    case 3:
      return (
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground mb-1">Choose your closing date</div>
          <div className="grid grid-cols-3 gap-3">
            {["7 days", "14 days", "30 days"].map((d, i) => (
              <div
                key={d}
                className={cn(
                  "rounded-xl border px-3 py-4 text-center text-sm font-semibold",
                  i === 0 ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                )}
              >
                {d}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-primary font-semibold pt-2">
            <Check className="w-3.5 h-3.5" /> We pay all closing costs
          </div>
        </div>
      );
    default:
      return null;
  }
}

export default function HowItWorksInteractivePreview() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % STEPS.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [paused]);

  const activeStep = STEPS[active];

  return (
    <section className="relative py-20 md:py-28 bg-background overflow-hidden">
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(38 92% 50% / 0.08) 0%, transparent 70%)" }}
        aria-hidden
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center text-center mb-14 md:mb-16">
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">How It Works</p>
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight max-w-2xl">
            From your address to cash in hand — here's the whole process.
          </h2>
        </div>

        <div
          className="grid md:grid-cols-12 gap-10 md:gap-6 items-center"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="md:col-span-5 flex flex-col">
            {STEPS.map((step, i) => {
              const isActive = i === active;
              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setActive(i)}
                  className={cn(
                    "group text-left flex gap-4 items-start py-5 border-l-2 pl-5 transition-colors",
                    isActive ? "border-primary" : "border-border/60 hover:border-primary/40"
                  )}
                >
                  <span
                    className={cn(
                      "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3
                      className={cn(
                        "font-bold mb-1 transition-colors",
                        isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      {step.title}
                    </h3>
                    {isActive && (
                      <p className="text-sm text-muted-foreground leading-relaxed animate-fade-in-up">
                        {step.desc}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="md:col-span-7">
            <div className="relative bg-card border border-border rounded-3xl p-2 shadow-2xl">
              <div className="rounded-[1.25rem] bg-[hsl(0,0%,9%)] border border-border/60 p-6 md:p-8 min-h-[360px] flex flex-col">
                <div key={active} className="animate-fade-in-up flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <activeStep.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">{activeStep.tag}</span>
                  </div>

                  <PreviewContent stepIndex={active} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-6">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Go to step ${i + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === active ? "w-8 bg-primary" : "w-1.5 bg-border"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
