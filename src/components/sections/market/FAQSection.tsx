"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { usePageConfig } from "@/context/PageContext";

interface FAQSectionProps {
  faqs?: { q: string; a: string }[];
}

const FAQSection = ({ faqs }: FAQSectionProps) => {
  const [open, setOpen] = useState<number | null>(null);
  const { situation, market } = usePageConfig();
  const resolvedFaqs = faqs ?? situation.faqs;

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-14">
          Frequently Asked Questions
        </h2>

        <div className="divide-y divide-border" role="list">
          {resolvedFaqs.map((faq, i) => (
            <div key={i} role="listitem">
              <h3>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between py-5 text-left hover:opacity-80 transition-opacity"
                  aria-expanded={open === i}
                  aria-controls={`faq-panel-${i}`}
                  id={`faq-button-${i}`}
                >
                  <span className="font-semibold pr-4">{faq.q.replace("{market}", market.name)}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${
                      open === i ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </h3>
              <div
                id={`faq-panel-${i}`}
                role="region"
                aria-labelledby={`faq-button-${i}`}
                hidden={open !== i}
              >
                {open === i && (
                  <div className="pb-5">
                    <p className="text-muted-foreground leading-relaxed">{faq.a.replaceAll("{market}", market.name)}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
