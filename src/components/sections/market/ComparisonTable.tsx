"use client";
import { usePageConfig } from "@/context/PageContext";

export interface ComparisonRow {
  label: string;
  us: string;
  agent: string;
  other: string;
}

export interface ComparisonColumns {
  us: string;
  agent: string;
  other: string;
}

export interface ComparisonCopy {
  heading: string;
  columns: ComparisonColumns;
  rows: ComparisonRow[];
}

const ComparisonTable = ({
  copy: copyOverride = {},
}: {
  copy?: Partial<ComparisonCopy>;
}) => {
  const { market } = usePageConfig();

  const copy = {
    heading: copyOverride.heading ?? "How We Compare",
    columns: copyOverride.columns ?? {
      us: "Tarek Buys Houses",
      agent: "Traditional Agent",
      other: "Other Investors",
    },
    rows: copyOverride.rows ?? [
      { label: "Timeline", us: "7-14 days", agent: market.comparisonAgentTimeline, other: "14-30 days" },
      { label: "Fees & Commissions", us: "$0", agent: market.comparisonAgentFees, other: "Varies (hidden fees)" },
      { label: "Repairs Required", us: "None — as-is", agent: "Usually required", other: "Sometimes" },
      { label: "Showings", us: "None", agent: "Dozens of strangers", other: "1-2 visits" },
      { label: "Who You Deal With", us: "Tarek's personal team", agent: "Random agent", other: "Unknown LLC" },
    ],
  };

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-14">
          {copy.heading}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full max-w-5xl mx-auto">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground"></th>
                <th className="text-left py-4 px-4 text-sm font-bold text-primary">{copy.columns.us}</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">{copy.columns.agent}</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">{copy.columns.other}</th>
              </tr>
            </thead>
            <tbody>
              {copy.rows.map((row, i) => (
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
