import { usePageConfig } from "@/context/PageContext";

const HowItWorks = () => {
  const { market } = usePageConfig();

  const steps = [
    {
      num: "1",
      title: "Tell Us About Your House",
      desc: "Text or call us with your address. We'll research the property and get back to you within 24 hours with a cash offer.",
    },
    {
      num: "2",
      title: "Get Your Cash Offer",
      desc: `No inspections, no appraisals, no waiting. We make a fair offer based on the ${market.name} market and your home's condition.`,
    },
    {
      num: "3",
      title: "Close On Your Timeline",
      desc: "Pick your closing date — 7 days, 14 days, 30 days. We pay all closing costs. You walk away with cash.",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-14">
          How It Works
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step) => (
            <div key={step.num} className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-5">
                {step.num}
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
