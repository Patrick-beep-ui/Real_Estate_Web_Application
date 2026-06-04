import { Shield, Scale, Building2, FileCheck, Mail, Phone, MapPin } from "lucide-react";

const guarantees = [
  {
    icon: Scale,
    title: "Licensed & Insured",
    desc: "Our company is fully licensed, bonded, and insured in every state we operate in. You're dealing with a real, accountable business — not an anonymous buyer.",
  },
  {
    icon: Building2,
    title: "Third-Party Title Company",
    desc: "All closings are handled by a reputable, state-licensed title & escrow company — never in-house. Your funds and title transfer are protected by an independent party.",
  },
  {
    icon: FileCheck,
    title: "No-Obligation Offer",
    desc: "Our cash offer is 100% free with zero obligation. You can walk away at any point before closing. No contracts that trap you, no pressure to accept.",
  },
  {
    icon: Shield,
    title: "Complete Confidentiality",
    desc: "No yard signs, no MLS listing, no public record of a distressed sale. Your situation — and your decision — stays between you and us.",
  },
];

export default function AboutProtectionGuarantee() {
  return (
    <section className="py-20 md:py-28 bg-background border-y border-border/50 relative overflow-hidden">
      {/* Subtle amber glow — bottom right */}
      <div
        className="absolute -bottom-32 -right-32 w-[500px] h-[500px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(38 92% 50% / 0.06) 0%, transparent 65%)",
        }}
        aria-hidden
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* ── Section header ───────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center mb-16 md:mb-20">
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">
            Your Protection Guarantee
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-5">
            This is a real estate transaction,{" "}
            <br className="hidden sm:block" />
            <span className="text-primary">not a back-alley deal.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
            Every step of this process is transparent, documented, and handled
            by licensed professionals. Here&rsquo;s exactly how we protect you.
          </p>
        </div>

        {/* ── Guarantee cards — 2×2 grid ───────────────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
          {guarantees.map((g) => (
            <div
              key={g.title}
              className="group flex gap-5 items-start bg-background rounded-2xl border border-border/60 p-7 md:p-8 transition-colors hover:border-primary/30"
            >
              {/* Icon */}
                <g.icon className="w-14 h-14 text-primary" />

              {/* Text */}
              <div>
                <h3 className="font-bold text-lg text-foreground mb-2">
                  {g.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {g.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Contact row ──────────────────────────────────────────────── */}
        <div className="mt-12 pt-10 border-t border-border/40">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 flex-wrap">

            <div className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                <Phone className="w-4 h-4 text-primary" />
              </div>
              <div className="flex items-center gap-2 text-lg text-foreground font-bold">
                <a href="tel:+18664073411" className="hover:text-primary transition-colors">(866) 407-3411</a>
                <span className="text-muted-foreground/40">|</span>
                <a href="tel:+13852591735" className="hover:text-primary transition-colors">385-259-1735</a>
              </div>
            </div>

            <a
              href="mailto:subscriptions@tarekbuyshouses.com"
              className="flex items-center gap-3 group"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <span className="text-lg text-foreground font-bold group-hover:text-primary transition-colors break-all">
                subscriptions@tarekbuyshouses.com
              </span>
            </a>

            <div className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <span className="text-lg text-foreground font-bold">
                4411 E La Palma Ave, Anaheim, CA 92807
              </span>
            </div>

          </div>

          <p className="text-center text-xs text-muted-foreground/40 mt-8 max-w-lg mx-auto leading-relaxed">
            Tarek Buys Houses, LLC operates as a licensed real estate company.
            All transactions are subject to standard state and local real estate laws.
          </p>
        </div>

      </div>
    </section>
  );
}
