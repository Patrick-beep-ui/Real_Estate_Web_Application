import { Shield, Scale, Building2, FileCheck } from "lucide-react";

const guarantees = [
  {
    icon: Scale,
    title: "Licensed & Insured",
    desc: "Our company is fully licensed, bonded, and insured in every state we operate in.",
  },
  {
    icon: Building2,
    title: "Third-Party Title Company",
    desc: "All closings are handled by a reputable, state-licensed title & escrow company — never in-house.",
  },
  {
    icon: FileCheck,
    title: "No-Obligation Offer",
    desc: "Our cash offer is 100% free with zero obligation. You're never pressured to accept.",
  },
  {
    icon: Shield,
    title: "Complete Confidentiality",
    desc: "No yard signs, no MLS listing, no public record of a distressed sale. Your privacy is protected.",
  },
];

const ProtectionGuarantee = () => {
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-2">
            Your Protection Guarantee
          </h2>
          <p className="text-muted-foreground text-sm">
            This is a real estate transaction, not a back-alley deal. Here's how we protect you.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {guarantees.map((g) => (
            <div
              key={g.title}
              className="rounded-xl bg-card border border-border p-5 text-center"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <g.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-sm mb-1">{g.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {g.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProtectionGuarantee;
