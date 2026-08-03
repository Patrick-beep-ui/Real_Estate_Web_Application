import { Shield, Scale, Building2, FileCheck, Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import PhoneLink from "@/components/shared/PhoneLink";
import { PHONE, buildTelLink, buildSmsLink } from "@/lib/phone";
import { CONTACT_EMAIL, buildMailtoLink } from "@/lib/contact";


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
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              <div className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div className="flex items-center gap-2 text-lg text-foreground font-bold">
                  <PhoneLink href={buildTelLink()} className="hover:text-primary transition-colors">{PHONE.call}</PhoneLink>
                </div>
              </div>

              <a
                href={buildMailtoLink()}
                className="flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <span className="text-lg text-foreground font-bold group-hover:text-primary transition-colors break-all">
                  {CONTACT_EMAIL}
                </span>
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              <PhoneLink
                href={buildSmsLink()}
                className="flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <span className="text-lg text-foreground font-bold group-hover:text-primary transition-colors">
                  Text {PHONE.text}
                </span>
              </PhoneLink>

              <div className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <span className="text-lg text-foreground font-bold">
                  4411 E La Palma Ave, Anaheim, CA 92807
                </span>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground/40 mt-8 max-w-xl mx-auto leading-relaxed">
            Tarek Buys Houses, LLC operates as a licensed real estate company. Tarek El Moussa | CA DRE Lic# 01329011.
            All transactions are subject to standard state and local real estate laws.
          </p>
        </div>

      </div>
    </section>
  );
}
