import { usePageConfig } from "@/context/PageContext";

const BeforeAfter = () => {
  const { situation, market } = usePageConfig();
  const hasNoEquity = !!situation.noEquityBeforeBody;

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
            <h3 className="text-xl font-bold mb-4">A {market.name} {situation.beforeTitle.replace("{market}", market.name)}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {situation.beforeBody.replaceAll("{market}", market.name)}
            </p>
          </div>

          {/* After */}
          <div className="rounded-2xl bg-[hsl(180,15%,14%)] p-8">
            <div className="text-sm font-bold uppercase tracking-wider text-[hsl(var(--green-check))] mb-4">
              AFTER
            </div>
            <h3 className="text-xl font-bold mb-4">{situation.afterTitle.replace("{market}", market.name)}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {situation.afterBody.replaceAll("{market}", market.name)}
            </p>
          </div>

          {/* Warning */}
          <div className="rounded-2xl bg-[hsl(0,15%,14%)] p-8">
            <h3 className="text-xl font-bold mb-4">
              {situation.warningTitle.replace("{market}", market.name)}
            </h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {situation.warningBody.replaceAll("{market}", market.name)}
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground/80 italic mt-6 max-w-3xl mx-auto mb-16">
          {situation.caseStudyDisclaimer.replaceAll("{market}", market.name)}
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
                    {situation.noEquityBeforeBody?.replaceAll("{market}", market.name)}
                  </p>
                </div>
                <div className="rounded-2xl bg-[hsl(180,15%,14%)] p-8">
                  <div className="text-sm font-bold uppercase tracking-wider text-[hsl(var(--green-check))] mb-4">
                    THE OUTCOME
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {situation.noEquityAfterBody?.replaceAll("{market}", market.name)}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground/80 italic max-w-3xl mx-auto">
              {situation.caseStudyDisclaimer.replaceAll("{market}", market.name)}
            </p>
          </>
        )}
      </div>
    </section>
  );
};

export default BeforeAfter;
