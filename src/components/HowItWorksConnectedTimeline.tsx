import { Home, PhoneCall, Calculator, KeyRound } from "lucide-react";

const STEPS = [
  {
    icon: Home,
    title: "Tell Us About Your Property",
    desc: "Address and a few basic details — 60 seconds.",
    stat: { label: "vs. prepping to list", value: "60 sec vs. weeks of prep" },
  },
  {
    icon: PhoneCall,
    title: "We Call You Within 24 Hours",
    desc: "Fair cash offer, based on comps and condition.",
    stat: { label: "vs. traditional agent", value: "24 hrs vs. days of showings" },
  },
  {
    icon: Calculator,
    title: "Review a Transparent Offer",
    desc: "See exactly how we got your number.",
    stat: { label: "fees & commissions", value: "$0 vs. 5–6% ($15K–$36K)" },
  },
  {
    icon: KeyRound,
    title: "Close On Your Timeline",
    desc: "7, 14, or 30 days — we pay closing costs.",
    stat: { label: "vs. traditional agent", value: "7–14 days vs. 60–180 days" },
  },
];

export default function HowItWorksConnectedTimeline() {
  return (
    <section className="py-20 md:py-28 bg-background relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center text-center mb-16 md:mb-24">
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">How It Works</p>
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight max-w-2xl">
            The fastest way from "for sale" to "sold" — and how it stacks up.
          </h2>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-primary/0 via-border to-primary/0" />

          <div className="grid md:grid-cols-4 gap-10 md:gap-6">
            {STEPS.map((step, i) => (
              <div key={step.title} className="group relative flex flex-col items-center text-center">
                {i !== 0 && <div className="md:hidden absolute -top-10 left-1/2 w-px h-10 bg-border" aria-hidden />}

                <div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border-2 border-border bg-card transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:-translate-y-1">
                  <step.icon className="w-6 h-6 text-primary transition-colors group-hover:text-primary-foreground" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-secondary border border-border text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>

                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.desc}</p>

                <div className="rounded-xl border px-3 py-2 w-full transition-colors border-border bg-secondary/30 group-hover:border-primary/30 group-hover:bg-primary/10">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{step.stat.label}</p>
                  <p className="text-sm font-bold transition-colors text-foreground group-hover:text-primary">
                    {step.stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
