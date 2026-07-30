"use client";

import { MessageCircle, Phone } from "lucide-react";
import { usePageConfig } from "@/context/PageContext";
import PhoneLink from "@/components/PhoneLink";
import {
  ALICE,
  BRIAN,
  SUSAN,
  TESTIMONIAL_DISCLAIMER,
  type VideoStory,
  type WrittenStory,
} from "@/data/testimonials";
import VideoStoryFrame from "./VideoStoryFrame";
import { SellerBadge, StarRow } from "./SellerBadge";

/**
 * Testimonials — featured layout. One bordered container: the vertical video
 * story on the left, written testimonials stacked on the right. Best when the
 * library is one video plus two written quotes.
 */
export default function TestimonialsFeatured({
  eyebrow = "What Sellers Say",
  title = "Real Stories from Real Homeowners",
  subtitle = "Three sellers, three different reasons for calling. All of them gave us permission to share what happened next.",
  video = ALICE,
  written = [BRIAN, SUSAN],
  showCta = true,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  video?: VideoStory;
  written?: WrittenStory[];
  showCta?: boolean;
}) {
  const { phone, text, smsLink, telLink } = usePageConfig();

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-3">
          {eyebrow ? (
            <span className="text-xs font-bold uppercase tracking-widest text-primary">{eyebrow}</span>
          ) : null}
          <h2 className="text-3xl font-extrabold leading-tight md:text-4xl">{title}</h2>
          {subtitle ? (
            <p className="max-w-xl text-base text-muted-foreground md:text-lg">{subtitle}</p>
          ) : null}
        </div>

        <div className="grid overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-[380px_1fr]">
          <div className="flex flex-col items-center gap-5 border-b border-border p-6 sm:p-8 lg:items-start lg:border-b-0 lg:border-r">
            <VideoStoryFrame story={video} className="aspect-[9/16] w-full max-w-[316px]" />
            <SellerBadge initial={video.initial} name={video.name} location={`${video.location} · Video story`} large />
          </div>

          <div className="flex flex-col">
            {written.map((t, i) => (
              <div
                key={t.id}
                className={`flex flex-col gap-5 p-6 sm:p-10 ${
                  i < written.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <StarRow />
                  <span className="inline-flex items-center rounded-full bg-secondary px-3.5 py-1 text-xs font-semibold text-[hsl(0,0%,74%)]">
                    {t.scenario}
                  </span>
                </div>
                <p className="text-xl font-extrabold leading-snug text-foreground md:text-2xl">&ldquo;{t.pullQuote}&rdquo;</p>
                <p className="text-sm leading-relaxed text-muted-foreground md:text-[15px]">&ldquo;{t.body}&rdquo;</p>
                <SellerBadge initial={t.initial} name={t.name} location={`${t.location} · Verified seller`} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-8">
          {showCta ? (
            <div className="flex flex-wrap gap-4">
              <PhoneLink
                href={smsLink}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-amber transition-all hover:brightness-125"
              >
                <MessageCircle className="h-5 w-5" />
                Text {text}
              </PhoneLink>
              <PhoneLink
                href={telLink}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-primary px-8 py-4 text-lg font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground"
              >
                <Phone className="h-5 w-5" />
                Call {phone}
              </PhoneLink>
            </div>
          ) : (
            <span />
          )}
          <p className="max-w-md text-xs italic text-muted-foreground/80">{TESTIMONIAL_DISCLAIMER}</p>
        </div>
      </div>
    </section>
  );
}
