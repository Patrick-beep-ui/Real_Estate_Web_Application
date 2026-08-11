"use client";
import { usePageConfig } from "@/context/PageContext";

interface BeforeAfterProps {
  beforeTitle?: string;
  beforeBody?: string;
  afterTitle?: string;
  afterBody?: string;
  warningTitle?: string;
  warningBody?: string;
  disclaimer?: string;
}

const BeforeAfter = ({
  beforeTitle,
  beforeBody,
  afterTitle,
  afterBody,
  warningTitle,
  warningBody,
  disclaimer,
}: BeforeAfterProps) => {
  const { situation, market } = usePageConfig();
  const hasNoEquity = !!situation.noEquityBeforeBody;
  const interpolate = (text: string) => text.replaceAll("{market}", market.name);

  const copy = {
    beforeTitle: beforeTitle ?? `A ${market.name} ${interpolate(situation.beforeTitle)}`,
    beforeBody: interpolate(beforeBody ?? situation.beforeBody),
    afterTitle: afterTitle ?? interpolate(situation.afterTitle),
    afterBody: interpolate(afterBody ?? situation.afterBody),
    warningTitle: warningTitle ?? interpolate(situation.warningTitle),
    warningBody: interpolate(warningBody ?? situation.warningBody),
    disclaimer: interpolate(disclaimer ?? situation.caseStudyDisclaimer),
  };

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-14">
          What Sellers Like You Experience
        </h2>

        {/* Primary case study — seller with equity */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-10">
          {/* Before */}
          <div className="rounded-2xl bg-[hsl(0,0%,14%)] p-8">
            <div className="text-sm font-bold uppercase tracking-wider text-[hsl(var(--red-x))] mb-4">
              BEFORE
            </div>
            <h3 className="text-xl font-bold mb-4">{copy.beforeTitle}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {copy.beforeBody}
            </p>
          </div>

          {/* After */}
          <div className="rounded-2xl bg-[hsl(180,15%,14%)] p-8">
            <div className="text-sm font-bold uppercase tracking-wider text-[hsl(var(--green-check))] mb-4">
              AFTER
            </div>
            <h3 className="text-xl font-bold mb-4">{copy.afterTitle}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {copy.afterBody}
            </p>
          </div>

          {/* Warning */}
          <div className="rounded-2xl bg-[hsl(0,15%,14%)] p-8">
            <h3 className="text-xl font-bold mb-4">
              {copy.warningTitle}
            </h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {copy.warningBody}
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground/80 italic mt-6 max-w-3xl mx-auto mb-16">
          {copy.disclaimer}
        </p>

        {/* Secondary case study — underwater / no equity */}
        {hasNoEquity && (
          <>
            <div className="max-w-4xl mx-auto mb-10">
              <div className="text-center mb-8">
                <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-3">
                  Underwater on Your Mortgage?
                </span>
                <h3 className="text-2xl md:text-3xl font-extrabold">
                  Even With No Equity, You Have Options
                </h3>
                <p className="text-muted-foreground text-sm mt-2 max-w-xl mx-auto">
                  We specialize in negotiating with banks to help you avoid foreclosure and protect your credit — often at no cost to you.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-[hsl(0,0%,14%)] p-8">
                  <div className="text-sm font-bold uppercase tracking-wider text-[hsl(var(--red-x))] mb-4">
                    THE SITUATION
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {situation.noEquityBeforeBody && interpolate(situation.noEquityBeforeBody)}
                  </p>
                </div>
                <div className="rounded-2xl bg-[hsl(180,15%,14%)] p-8">
                  <div className="text-sm font-bold uppercase tracking-wider text-[hsl(var(--green-check))] mb-4">
                    THE OUTCOME
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {situation.noEquityAfterBody && interpolate(situation.noEquityAfterBody)}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground/80 italic max-w-3xl mx-auto">
              {copy.disclaimer}
            </p>
          </>
        )}
      </div>
    </section>
  );
};

export default BeforeAfter;
