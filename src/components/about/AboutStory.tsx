import { CheckCircle } from "lucide-react";

export default function AboutStory() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-stretch">
          <div>
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">
              Our Story
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6">
              From Reality TV to Real Estate —{" "}
              <span className="text-primary">Helping Homeowners Nationwide</span>
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Tarek Buys Houses was founded on something Tarek El Moussa learned over 15 years and 200+ renovations on camera: behind every house is a person with a reason for selling. A job across the country. A house that&rsquo;s become too much to manage. An inheritance nobody planned for. A deadline that&rsquo;s closing in.
              </p>
              <p>
                Most of those people don&rsquo;t need a lecture about market conditions. They need a straight answer, a fair number, and a way out that doesn&rsquo;t cost them their dignity.
              </p>
              <p>
                That&rsquo;s what we do. We buy houses directly for cash — as-is, on your timeline — so you can skip the repairs, the showings, the agent commissions, and the months of not knowing.
              </p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-8 md:p-10">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              Why Homeowners Choose Us
            </h3>
            <ul className="space-y-4">
              {[
                "Sell as-is — no repairs, no cleaning, no inspections",
                "Zero commissions or closing costs",
                "Close in as few as 7 days — on your schedule",
                "Cash payment — no financing contingencies",
                "No showings, no open houses, no strangers through your home",
                "Free, no-obligation offer",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
