"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_CATEGORIES: { value: string; label: string }[] = [
  { value: "seller-guides", label: "Seller Guides" },
  { value: "market-trends", label: "Market Trends" },
  { value: "cash-offers", label: "Cash Offers" },
  { value: "real-estate-tips", label: "Real Estate Tips" },
  { value: "local-insights", label: "Local Insights" },
];

type Props = {
  value: string;
  onChange: (value: string) => void;
  categories?: { value: string; label: string }[];
};

export function BlogCategoryFilter({ value, onChange, categories }: Props) {
  const items = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="All Categories" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Categories</SelectItem>
        {items.map((cat) => (
          <SelectItem key={cat.value} value={cat.value}>
            {cat.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
