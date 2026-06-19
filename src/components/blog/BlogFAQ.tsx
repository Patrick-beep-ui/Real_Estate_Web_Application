"use client";

import { FadeInView } from "@/components/blog/FadeInView";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";

interface FAQ {
  question: string;
  answer: string;
}

interface BlogFAQProps {
  faqItems: FAQ[];
  postTitle: string;
}

export function BlogFAQ({ faqItems, postTitle }: BlogFAQProps) {
  if (!faqItems || faqItems.length === 0) return null;

  return (
    <FadeInView delay={0.25}>
      <section className="mt-16 pt-12 border-t border-border">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
          Frequently Asked Questions
        </h2>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqItems.map((item, index) => (
            <AccordionItem
              key={index}
              value={`faq-${index}`}
              className="border border-border rounded-lg px-4 data-[state=open]:bg-muted/50"
            >
              <AccordionTrigger className="hover:no-underline py-4 text-left">
                <div className="flex items-start gap-3 flex-1">
                  <ChevronDown className="w-5 h-5 text-accent mt-0.5 flex-shrink-0 transition-transform" />
                  <span className="font-semibold text-foreground">
                    {item.question}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4 pl-8">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <script
        type="application/ld+json"
        data-blog-faq-schema={`faq-${postTitle}`}
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          }),
        }}
      />
    </FadeInView>
  );
}
