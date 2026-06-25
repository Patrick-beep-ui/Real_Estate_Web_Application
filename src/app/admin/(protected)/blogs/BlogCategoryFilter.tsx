"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  "seller-guides",
  "market-trends",
  "cash-offers",
  "real-estate-tips",
  "local-insights",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  "seller-guides": "Seller Guides",
  "market-trends": "Market Trends",
  "cash-offers": "Cash Offers",
  "real-estate-tips": "Real Estate Tips",
  "local-insights": "Local Insights",
};

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function BlogCategoryFilter({ value, onChange }: Props) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="All Categories" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Categories</SelectItem>
        {CATEGORIES.map((cat) => (
          <SelectItem key={cat} value={cat}>
            {CATEGORY_LABELS[cat] || cat}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
