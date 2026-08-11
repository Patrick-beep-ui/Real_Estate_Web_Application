"use client";
import { usePageConfig } from "@/context/PageContext";

const ComparisonTable = () => {
  const { market } = usePageConfig();

  const rows = [
    { label: "Timeline", us: "7-14 days", agent: market.comparisonAgentTimeline, other: "14-30 days" },
    { label: "Fees & Commissions", us: "$0", agent: market.comparisonAgentFees, other: "Varies (hidden fees)" },
    { label: "Repairs Required", us: "None — as-is", agent: "Usually required", other: "Sometimes" },
    { label: "Showings", us: "None", agent: "Dozens of strangers", other: "1-2 visits" },
    //{ label: "Certainty of Close", us: "100% — cash buyer", agent: "~80% (financing falls through)", other: "Varies" },
    { label: "Who You Deal With", us: "Tarek's personal team", agent: "Random agent", other: "Unknown LLC" },
    
  ];

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-14">
          How We Compare
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full max-w-5xl mx-auto">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground"></th>
                <th className="text-left py-4 px-4 text-sm font-bold text-primary">Tarek Buys Houses</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Traditional Agent</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Other Investors</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-4 px-4 text-sm font-medium">{row.label}</td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-semibold text-primary">
                      {row.us}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-muted-foreground">
                      {row.agent}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-muted-foreground">
                      {row.other}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default ComparisonTable;
