"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle, MessageCircle, Phone, Play, Star } from "lucide-react";
import { usePageConfig } from "@/context/PageContext";
import PhoneLink from "@/components/PhoneLink";
import { TESTIMONIALS } from "@/data/testimonials";
import { TESTIMONIAL_DISCLAIMER, type Testimonial } from "@/types/testimonial";
import { useTestimonials } from "@/hooks/testimonials/useTestimonials";
import VideoStoryFrame from "./VideoStoryFrame";
import { StarRow } from "./SellerBadge";

/**
 * Testimonials — spotlight layout. A seller rail selects the story shown in
 * the spotlight. Absorbs new tracker entries without a layout change and lets
 * visitors self-select the situation closest to theirs.
 */
export default function TestimonialsSpotlight({
  eyebrow = "Seller Stories",
  title = "Pick a Story That Sounds Like Yours",
  stories: propStories,
  showPendingSlot = true,
  pendingLabel = "Next stories drop in here",
  showTrust = true,
}: {
  eyebrow?: string;
  title?: string;
  stories?: Testimonial[];
  showPendingSlot?: boolean;
  pendingLabel?: string;
  showTrust?: boolean;
}) {
  const { phone, text, smsLink, telLink, market } = usePageConfig();
  const { data: dbStories } = useTestimonials();
  const stories = propStories ?? (dbStories && dbStories.length > 0 ? dbStories : TESTIMONIALS);
  const [active, setActive] = useState(0);
  const current = stories[active] ?? stories[0];
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (spotlightRef.current && window.innerWidth < 1024) {
      spotlightRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [active]);

  if (stories.length === 0) return null;

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end lg:gap-10">
          <div className="flex flex-col gap-3">
            {eyebrow ? (
              <span className="text-xs font-bold uppercase tracking-widest text-primary">{eyebrow}</span>
            ) : null}
            <h2 className="text-3xl font-extrabold leading-tight md:text-4xl">{title}</h2>
          </div>
          <span className="text-sm text-muted-foreground lg:pb-2">
            {stories.length} stories · more added as sellers share them
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="flex flex-col gap-3">
            {stories.map((s, i) => {
              const isActive = i === active;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(i)}
                  aria-pressed={isActive}
                  className={`flex items-center gap-3 rounded-xl border p-5 text-left transition-colors ${
                    isActive ? "border-primary bg-primary/[0.08]" : "border-border bg-card hover:border-[hsl(0,0%,30%)]"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[17px] font-bold ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-[hsl(0,0%,74%)]"
                    }`}
                  >
                    {s.initial}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={`text-base font-bold ${isActive ? "text-foreground" : "text-[hsl(0,0%,74%)]"}`}>
                      {s.name}
                    </span>
                    <span className={`text-sm ${isActive ? "text-[hsl(0,0%,74%)]" : "text-[hsl(0,0%,50%)]"}`}>
                      {s.kind === "video" ? s.location : `${s.scenario.split(" · ")[0]} · ${s.location.split(", ")[1] ?? s.location}`}
                    </span>
                  </span>
                  {s.kind === "video" ? (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${isActive ? "text-primary" : "text-[hsl(0,0%,50%)]"}`}>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Video
                    </span>
                  ) : (
                    <span className={`text-xs font-semibold ${isActive ? "text-primary" : "text-[hsl(0,0%,50%)]"}`}>
                      Written
                    </span>
                  )}
                </button>
              );
            })}

            {showPendingSlot ? (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-border p-5">
                <span className="text-sm text-[hsl(0,0%,50%)]">{pendingLabel}</span>
              </div>
            ) : null}

            {showTrust ? (
              <div className="mt-2 flex flex-col gap-4 border-t border-border pt-5">
                <StarRow />
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-semibold text-primary">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    {market.stats.googleRating} Google
                  </span>
                  <span>·</span>
                  <span>{market.stats.bbbRating} BBB</span>
                  <span>·</span>
                  <span>{market.stats.homesClosed} Homes Purchased</span>
                </div>
              </div>
            ) : null}
          </div>

          <div
            ref={spotlightRef}
            className={`scroll-mt-24 grid gap-8 rounded-2xl border border-border bg-card p-6 sm:p-8 ${
              current.kind === "video" ? "lg:grid-cols-[300px_1fr]" : ""
            }`}
          >
            {current.kind === "video" ? (
              <VideoStoryFrame key={current.id} story={current} className="aspect-[9/16] w-full max-w-[300px] mx-auto lg:mx-0" />
            ) : null}
            <div className="flex flex-col gap-6">
              <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                {current.kind === "video" ? "Video story" : "Written story"} · {current.location}
              </span>
              <h3 className="text-2xl font-extrabold leading-snug md:text-[34px]">
                {current.kind === "video" ? current.headline : `\u201C${current.pullQuote}\u201D`}
              </h3>
              <p className="text-base leading-[1.7] text-muted-foreground md:text-[17px]">{current.body}</p>
              <div className="h-px bg-border" />
              <ul className="flex flex-col gap-4">
                {current.points.map((p) => (
                  <li key={p} className="flex items-center gap-3">
                    <CheckCircle className="h-[18px] w-[18px] shrink-0 text-primary" />
                    <span className="text-base text-[hsl(0,0%,74%)]">{p}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-4 pt-2">
                <PhoneLink
                  href={smsLink}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-base font-bold text-primary-foreground shadow-amber transition-all hover:brightness-125"
                >
                  <MessageCircle className="h-[18px] w-[18px]" />
                  Text {text}
                </PhoneLink>
                <PhoneLink
                  href={telLink}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-primary px-7 py-3.5 text-base font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                >
                  <Phone className="h-[18px] w-[18px]" />
                  Call {phone}
                </PhoneLink>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs italic text-muted-foreground/80">{TESTIMONIAL_DISCLAIMER}</p>
      </div>
    </section>
  );
}
