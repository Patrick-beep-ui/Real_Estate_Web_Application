"use client";

import { useState } from "react";
import { MessageCircle, Play, Shield } from "lucide-react";
import { usePageConfig } from "@/context/PageContext";
import PhoneLink from "@/components/PhoneLink";
import { TESTIMONIALS } from "@/data/testimonials";
import { TESTIMONIAL_DISCLAIMER, type Testimonial } from "@/types/testimonial";
import { useTestimonialSection } from "@/hooks/testimonials/useTestimonials";
import VideoStoryFrame from "./VideoStoryFrame";
import { SellerBadge, StarRow } from "./SellerBadge";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-wider text-[hsl(0,0%,50%)]">{label}</span>
      <span className="text-[15px] font-semibold text-foreground">{value}</span>
    </div>
  );
}

export default function TestimonialsEditorial({
  title = "What sellers said after we closed",
  consentNote = "Every story below is shared with the seller's written consent",
  stories: propStories,
  ctaLabel = "Tell us about your house",
  ctaHref = "#cta-form",
}: {
  title?: string;
  consentNote?: string;
  stories?: Testimonial[];
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const { smsLink } = usePageConfig();
  const { data: dbStories } = useTestimonialSection("editorial");
  const stories = propStories ?? (dbStories && dbStories.length > 0 ? dbStories : TESTIMONIALS);
  const [autoPlayId, setAutoPlayId] = useState<string | null>(null);

  if (stories.length === 0) return null;

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto flex max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 pb-10 lg:flex-row lg:items-end lg:gap-10">
          <h2 className="max-w-xl text-3xl font-extrabold leading-[1.05] md:text-5xl">{title}</h2>
          {consentNote ? (
            <div className="flex items-center gap-2 lg:pb-2">
              <Shield className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm text-muted-foreground">{consentNote}</span>
            </div>
          ) : null}
        </div>

        {stories.map((s, i) => {
          const last = i === stories.length - 1;
          const rowClass = `border-t border-border py-10 md:py-12 ${last ? "border-b" : ""}`;
          const index = `Story 0${i + 1}`;

          if (s.kind === "video") {
            return (
              <div key={s.id} className={`${rowClass} grid gap-8 lg:grid-cols-[260px_1fr_240px] lg:gap-12`}>
                <VideoStoryFrame story={s} autoPlay={autoPlayId === s.id} className="aspect-[9/16] w-full max-w-[260px] mx-auto lg:mx-0" />
                <div className="flex flex-col gap-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">
                    {index} · {s.scenario}
                  </span>
                  <h3 className="max-w-lg text-2xl font-extrabold leading-tight md:text-[38px]">{s.headline}</h3>
                  <p className="max-w-lg text-base leading-relaxed text-muted-foreground md:text-[17px]">{s.body}</p>
                  <button
                    type="button"
                    onClick={() => setAutoPlayId(s.id)}
                    className="inline-flex w-fit items-center gap-2 rounded-xl border-2 border-primary px-7 py-3.5 text-base font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Watch {s.name.split(" ")[0]}&rsquo;s story
                  </button>
                </div>
                <div className="flex flex-col gap-5">
                  <SellerBadge initial={s.initial} name={s.name} location={s.location} />
                  <div className="h-px bg-border" />
                  <Fact label="Format" value="Self-recorded video" />
                  <Fact label="Consent" value="On file" />
                </div>
              </div>
            );
          }

          return (
            <div key={s.id} className={`${rowClass} grid gap-8 lg:grid-cols-[1fr_240px] lg:gap-12`}>
              <div className="flex flex-col gap-6 md:gap-8">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  {index} · {s.scenario}
                </span>
                <p className="max-w-4xl text-2xl font-bold leading-snug tracking-[-0.01em] md:text-[34px] md:leading-[1.35]">
                  &ldquo;{s.pullQuote}&rdquo;
                </p>
                <p className="max-w-4xl text-base leading-[1.7] text-muted-foreground md:text-[17px]">
                  &ldquo;{s.body}&rdquo;
                </p>
              </div>
              <div className="flex flex-col gap-5 lg:pt-8">
                <StarRow />
                <SellerBadge initial={s.initial} name={s.name} location={s.location} />
                <div className="h-px bg-border" />
                <Fact label="Why they called" value={s.reason} />
              </div>
            </div>
          );
        })}

        <div className="flex flex-wrap items-center justify-between gap-6 pt-10">
          <p className="max-w-xl text-xs italic text-muted-foreground/80">{TESTIMONIAL_DISCLAIMER}</p>
          {ctaLabel ? (
            <PhoneLink
              href={smsLink}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-amber transition-all hover:brightness-125"
            >
              <MessageCircle className="h-5 w-5" />
              {ctaLabel}
            </PhoneLink>
          ) : (
            <a href={ctaHref} className="sr-only">
              Get your cash offer
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
