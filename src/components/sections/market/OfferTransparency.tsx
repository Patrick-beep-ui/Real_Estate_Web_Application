import { Calculator, ArrowRight } from "lucide-react";

interface OfferStep {
  label: string;
  desc: string;
  example: string;
  highlight?: boolean;
}

interface OfferTransparencyCopy {
  badge: string;
  heading: string;
  subheading: string;
  steps: OfferStep[];
  footnote: string;
}

const DEFAULT_STEPS: OfferStep[] = [
  {
    label: "After Repair Value (ARV)",
    desc: "We research comparable sales in your area to determine what your home would sell for in perfect condition.",
    example: "$320,000",
  },
  {
    label: "Minus Repair Costs",
    desc: "We estimate what it would cost to bring the property to market-ready condition.",
    example: "– $45,000",
  },
  {
    label: "Minus Our Margin",
    desc: "A small margin to keep our business running. This covers holding costs, transaction fees, and our profit.",
    example: "– $35,000",
  },
  {
    label: "Your Cash Offer",
    desc: "The amount you walk away with at closing. No hidden fees, no commissions, no surprises.",
    example: "$240,000",
    highlight: true,
  },
];

const OfferTransparency = ({
  copy: copyOverride = {},
}: {
  copy?: Partial<OfferTransparencyCopy>;
}) => {
  const copy = {
    badge: copyOverride.badge ?? "Radical Transparency",
    heading: copyOverride.heading ?? "How We Calculate Your Offer",
    subheading:
      copyOverride.subheading ??
      "No black boxes. No guessing games. Here's exactly how we arrive at your number — and we'll walk you through every line.",
    steps: copyOverride.steps ?? DEFAULT_STEPS,
    footnote:
      copyOverride.footnote ??
      "Example based on a typical property. Your actual offer will be based on your home's specific condition and local market data.",
  };

  return (
    <section className="py-16 md:py-24 bg-card">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <Calculator className="w-4 h-4" />
            {copy.badge}
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            {copy.heading}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {copy.subheading}
          </p>
        </div>

        <div className="space-y-4">
          {copy.steps.map((step, i) => (
            <div
              key={i}
              className={`rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-4 ${
                step.highlight
                  ? "bg-primary/10 border-2 border-primary"
                  : "bg-[hsl(0,0%,14%)]"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {i < copy.steps.length - 1 && (
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Step {i + 1}
                    </span>
                  )}
                  {step.highlight && (
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      Your Offer
                    </span>
                  )}
                </div>
                <h3 className={`text-lg font-bold mb-1 ${step.highlight ? "text-primary" : ""}`}>
                  {step.label}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
              <div className={`text-2xl font-extrabold whitespace-nowrap ${
                step.highlight ? "text-primary" : "text-foreground"
              }`}>
                {step.example}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground/60 italic mt-6">
          {copy.footnote}
        </p>
      </div>
    </section>
  );
};

export default OfferTransparency;
