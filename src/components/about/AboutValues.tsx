import Link from "next/link";
import { ArrowRight } from "lucide-react";

const values = [
  {
    title: "Transparency First",
    desc: "No hidden fees, no fine print. The offer we make is the cash you receive at closing.",
  },
  {
    title: "Speed Without Pressure",
    desc: "We close in as few as 7 days — but only when you're ready. You're always in control.",
  },
  {
    title: "Local Expertise",
    desc: "Our team knows your market. We price every offer based on real local comps, not algorithms.",
  },
  {
    title: "Privacy Guaranteed",
    desc: "No for-sale signs, no open houses, no neighbors asking questions. Your situation stays confidential.",
  },
];

export default function AboutValues() {
  return (
    <section className="py-24 md:py-32 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-20 border-b border-border pb-12">
          <div className="max-w-2xl">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-4">
              Our Values
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
              The Principles Behind <br />
              Every Home Purchase
            </h2>
          </div>
          <div className="flex flex-col gap-6 items-start lg:items-end">
            <p className="text-muted-foreground max-w-sm text-sm md:text-base leading-relaxed text-left lg:text-right">
              These aren&rsquo;t slogans — they&rsquo;re the principles that shape every interaction and every outcome.
            </p>
            <Link
              href="/#get-offer"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:brightness-110 transition-all text-base shadow-amber group"
            >
              Get Your Cash Offer <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <div className="grid gap-px bg-border overflow-hidden rounded-2xl border border-border">
          <div className="grid md:grid-cols-2 gap-px">
            {values.map((v, i) => (
              <div
                key={v.title}
                className="bg-card p-10 md:p-14 group"
              >
                <span className="text-[10px] font-bold text-primary/30 uppercase tracking-[0.3em] mb-6 block">
                  0{i + 1}
                </span>
                <h3 className="font-bold text-xl mb-3 text-foreground group-hover:text-primary transition-colors">
                  {v.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
