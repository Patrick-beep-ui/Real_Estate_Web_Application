"use client";

import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const STEPS = [
  {
    num: "01",
    title: "Tell Us About Your Property",
    desc: "Share your address and a few basic details — online, by text, or by phone.",
    detail:
      "No paperwork, no walkthroughs to schedule. We just need the address and a general sense of the property's condition to get started — it takes about 60 seconds.",
    chips: ["Takes 60 seconds", "No obligation"],
  },
  {
    num: "02",
    title: "We Call You Within 24 Hours",
    desc: "We research the property and your local market, then call with a fair cash offer.",
    detail:
      "No inspections, no appraisals, no waiting around. Our team pulls comparable sales in your area and calls you directly — you'll talk to a real person on Tarek's team, not a call center.",
    chips: ["24-hour response", "Tarek's personal team"],
  },
  {
    num: "03",
    title: "Review a Transparent Offer",
    desc: "We show you exactly how we calculated your number — line by line.",
    detail:
      "Comparable sales, minus estimated repairs, minus our margin — that's it. No hidden fees, no commissions, no surprises at closing. Take your time; there's zero pressure either way.",
    chips: ["Zero hidden fees", "100% transparent"],
  },
  {
    num: "04",
    title: "Close On Your Timeline",
    desc: "Pick your date, sign with a licensed title company, and walk away with cash.",
    detail:
      "Choose 7, 14, or 30 days — whatever works for you. We pay all closing costs, and a reputable third-party title & escrow company handles the paperwork, never us.",
    chips: ["7–30 day close", "We pay closing costs"],
  },
];

export default function HowItWorksEditorialAccordion() {
  const [open, setOpen] = useState<string>("01");

  return (
    <section className="py-20 md:py-28 bg-card">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14 md:mb-16">
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">How It Works</p>
          <h2 className="text-3xl md:text-5xl font-extrabold leading-tight max-w-xl">
            Four steps.
            <br />
            Zero surprises.
          </h2>
        </div>

        <Accordion
          type="single"
          collapsible
          value={open}
          onValueChange={(v) => setOpen(v)}
          className="border-t border-border"
        >
          {STEPS.map((step) => (
            <AccordionItem key={step.num} value={step.num} className="border-border">
              <AccordionTrigger className="hover:no-underline py-7 [&>svg]:text-primary [&>svg]:w-5 [&>svg]:h-5">
                <div className="flex items-baseline gap-5 md:gap-8 text-left">
                  <span className="text-2xl md:text-4xl font-extrabold text-primary/25 tabular-nums w-12 md:w-16 flex-shrink-0">
                    {step.num}
                  </span>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 font-normal">{step.desc}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-[68px] md:pl-24 pr-2">
                  <p className="text-muted-foreground leading-relaxed mb-4">{step.detail}</p>
                  <div className="flex flex-wrap gap-2">
                    {step.chips.map((chip) => (
                      <Badge key={chip} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {chip}
                      </Badge>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
