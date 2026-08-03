"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  filterStatus: string;
  onFilterStatusChange: (v: string) => void;
  filterScenario: string;
  onFilterScenarioChange: (v: string) => void;
  scenarios: string[];
}

export function TestimonialToolbar({
  search, onSearchChange,
  filterStatus, onFilterStatusChange,
  filterScenario, onFilterScenarioChange,
  scenarios,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Tabs value={filterStatus} onValueChange={onFilterStatusChange}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="relative max-w-sm flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, body, location\u2026"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <select
        value={filterScenario}
        onChange={(e) => onFilterScenarioChange(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
      >
        <option value="all">All scenarios</option>
        {scenarios.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}
