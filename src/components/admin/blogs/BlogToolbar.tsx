"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BlogCategoryFilter } from "./BlogCategoryFilter";
import { DateRangeFilter } from "@/app/admin/(protected)/leads/DateRangeFilter";

interface BlogToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterCategory: string;
  onFilterCategoryChange: (value: string) => void;
  categories: { value: string; label: string }[];
  dateRange: { from?: Date; to?: Date };
  onDateRangeChange: (range: { from?: Date; to?: Date } | undefined) => void;
}

export function BlogToolbar({
  search, onSearchChange, filterCategory, onFilterCategoryChange,
  categories, dateRange, onDateRangeChange,
}: BlogToolbarProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative max-w-sm flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by title, slug, category\u2026"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex items-center gap-4">
        <BlogCategoryFilter value={filterCategory} onChange={onFilterCategoryChange} categories={categories} />
        <DateRangeFilter value={dateRange} onChange={(range) => onDateRangeChange(range)} />
      </div>
    </div>
  );
}
