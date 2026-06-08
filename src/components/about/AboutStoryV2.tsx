export default function AboutStoryV2() {
  return (
    <section className="py-20 md:py-32 bg-background relative overflow-hidden">
      {/* Ambient amber glow — top-left */}
      <div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(38 92% 50% / 0.07) 0%, transparent 65%)",
        }}
        aria-hidden
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* ── Section header ───────────────────────────────────────────── */}
        <div className="mb-14 md:mb-20">
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-5">
            Our Story
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold leading-tight max-w-2xl">
            From Reality TV to Real Estate {" - "}
            <span className="text-primary">Helping Homeowners Nationwide</span>
          </h2>
        </div>

        {/* ── Pull quote — visual hero of the section ───────────────────── */}
        <div className="pl-6 md:pl-12 border-l-[3px] border-primary mb-20 md:mb-28">
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold italic leading-snug text-foreground max-w-4xl">
            &ldquo;Behind every house is a person with a reason for
            selling.&rdquo;
          </p>
          <p className="text-primary text-[11px] font-bold uppercase tracking-[0.22em] mt-5">
            — Tarek El Moussa, Founder
          </p>
        </div>

        {/* ── Narrative + stat vignette ─────────────────────────────────── */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-12 lg:gap-20 items-start">

          {/* Narrative */}
          <div className="space-y-6">
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Tarek Buys Houses was built on something Tarek learned across 15 years
              and 200+ renovations on camera. Most people selling a home aren&rsquo;t
              looking for a market analysis. They have a job across the country, a
              house that became too much to manage, an inheritance nobody planned for,
              a deadline that&rsquo;s already closing in.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              What they need is a straight answer, a fair number, and a way forward
              that doesn&rsquo;t cost them their dignity. That&rsquo;s what we do —
              buy homes directly for cash, as-is, on your timeline. No repairs, no
              showings, no months of not knowing.
            </p>
          </div>

          {/* Stat vignette */}
          <div
            className="rounded-2xl p-8 md:p-10 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, hsl(38 92% 50% / 0.07), hsl(0 0% 7% / 0.0), hsl(38 92% 50% / 0.03))",
              border: "1px solid hsl(38 92% 50% / 0.22)",
            }}
          >
            {/* Top amber line */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background:
                  "linear-gradient(to right, transparent, hsl(38 92% 50%), transparent)",
              }}
              aria-hidden
            />

            <div className="space-y-8">
              {/* Stat 1 */}
              <div>
                <p className="text-6xl md:text-7xl font-extrabold text-primary leading-none tabular-nums">
                  1,000<span className="text-2xl md:text-3xl">+</span>
                </p>
                <p className="text-sm font-semibold text-foreground mt-3 uppercase tracking-wider">
                  Families helped
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Foreclosures, divorces, relocations, inherited properties
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-border/40" />

              {/* Stat 2 */}
              <div>
                <p className="text-5xl md:text-6xl font-extrabold text-foreground leading-none">
                  15<span className="text-primary text-3xl md:text-4xl">+</span>
                </p>
                <p className="text-sm font-semibold text-foreground mt-3 uppercase tracking-wider">
                  Years buying for cash
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Every situation, every condition, across the country
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
