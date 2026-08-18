"use client";
import { usePageConfig } from "@/context/PageContext";
import type { LandingContent } from "@/lib/landing/data";

const BeforeAfter = ({ landingSource }: { landingSource?: LandingContent }) => {
  const { situation, market } = usePageConfig();
  const interpolate = (text: string) => text.replaceAll("{market}", market.name);

  const beforeAfter = landingSource?.beforeAfter;

  const copy = {
    beforeTitle: beforeAfter?.beforeTitle ?? interpolate(situation.beforeTitle),
    traditionalPathBody: interpolate(beforeAfter?.traditionalPathBody ?? situation.traditionalPathBody),
    afterTitle: beforeAfter?.afterTitle ?? interpolate(situation.afterTitle),
    directPathBody: interpolate(beforeAfter?.directPathBody ?? situation.directPathBody),
    warningTitle: beforeAfter?.warningTitle ?? interpolate(situation.warningTitle),
    warningBody: interpolate(beforeAfter?.warningBody ?? situation.warningBody),
  };

  const noEquity = situation.noEquity;

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-14">
          What Sellers Like You Experience
        </h2>

        {/* Three paths: usual route, direct sale, cost of waiting */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-10">
          {/* The usual route */}
          <div className="rounded-2xl bg-[hsl(0,0%,14%)] p-8">
            <div className="text-sm font-bold uppercase tracking-wider text-[hsl(var(--red-x))] mb-4">
              THE USUAL ROUTE
            </div>
            <h3 className="text-xl font-bold mb-4">{copy.beforeTitle}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {copy.traditionalPathBody}
            </p>
          </div>

          {/* A direct sale */}
          <div className="rounded-2xl bg-[hsl(180,15%,14%)] p-8">
            <div className="text-sm font-bold uppercase tracking-wider text-[hsl(var(--green-check))] mb-4">
              A DIRECT SALE
            </div>
            <h3 className="text-xl font-bold mb-4">{copy.afterTitle}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {copy.directPathBody}
            </p>
          </div>

          {/* Cost of waiting */}
          <div className="rounded-2xl bg-[hsl(0,15%,14%)] p-8">
            <h3 className="text-xl font-bold mb-4">
              {copy.warningTitle}
            </h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {copy.warningBody}
            </p>
          </div>
        </div>

        {/* No-equity explainer — underwater options */}
        {noEquity && (
          <div className="max-w-5xl mx-auto mt-16">
            <div className="text-center mb-8">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-3">
                {noEquity.heading}
              </span>
              <p className="text-muted-foreground text-sm mt-2 max-w-xl mx-auto">
                {noEquity.body}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {noEquity.options.map((opt) => (
                <div key={opt.label} className="rounded-2xl bg-card border border-border p-6">
                  <h4 className="text-base font-bold mb-3">{opt.label}</h4>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {opt.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default BeforeAfter;
