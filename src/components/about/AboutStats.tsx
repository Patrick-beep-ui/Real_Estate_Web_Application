import { Building2, Users, DollarSign, Clock } from "lucide-react";

const stats = [
  { icon: Building2, value: "1,000+", label: "Homes Purchased" },
  { icon: Users, value: "99%", label: "Satisfied Sellers" },
  { icon: DollarSign, value: "$500M+", label: "Paid to Homeowners" },
  { icon: Clock, value: "7 Days", label: "Average Close Time" },
];

export default function AboutStats() {
  return (
    <section className="py-12 md:py-16 bg-card border-y border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <s.icon className="w-6 h-6 text-primary mx-auto mb-3" />
              <p className="text-2xl md:text-3xl font-extrabold text-foreground mb-1">
                {s.value}
              </p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
