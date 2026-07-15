"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { QualificationFilter } from "./useLeadFilters";

const QUALIFICATION_QUESTIONS: Record<string, { label: string; options: string[] }> = {
  timeline_to_sell: {
    label: "Timeline to Sell",
    options: ["ASAP (within 30 days)", "1–3 months", "3–6 months", "6-12 months", "Just exploring my options"],
  },
  listed_with_agent: {
    label: "Listed with Agent",
    options: ["Listed", "Unlisted"],
  },
  property_age: {
    label: "Property Age",
    options: ["20+ Years Old", "10-19 Years Old", "5 to 9 Years Old", "3-4 Years Old", "1-2 Years Old"],
  },
};

type Props = {
  filters: QualificationFilter[];
  onAdd: (question: string) => void;
  onUpdate: (id: string, value: string) => void;
  onRemove: (id: string) => void;
};

export function QualificationFilters({ filters, onAdd, onUpdate, onRemove }: Props) {
  const addedQuestions = new Set(filters.map((f) => f.question));
  const availableQuestions = Object.entries(QUALIFICATION_QUESTIONS).filter(
    ([key]) => !addedQuestions.has(key)
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Qualification Filters
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" align="start">
          {availableQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground px-3 py-2">All filters added</p>
          ) : (
            availableQuestions.map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => onAdd(key)}
                className="w-full text-left text-sm px-3 py-2 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {label}
              </button>
            ))
          )}
        </PopoverContent>
      </Popover>

      {filters.map((f) => {
        const question = QUALIFICATION_QUESTIONS[f.question];
        if (!question) return null;
        return (
          <Badge key={f.id} variant="secondary" className="gap-1.5 pl-2.5 pr-1 py-1 text-sm font-normal">
            <span className="font-medium text-foreground">{question.label}:</span>
            <Select value={f.value} onValueChange={(val) => onUpdate(f.id, val)}>
              <SelectTrigger className="h-auto w-auto border-0 bg-transparent p-0 px-1 text-xs shadow-none hover:bg-transparent focus:ring-0 [&>span]:max-w-[180px] [&>span]:truncate">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {question.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={() => onRemove(f.id)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-background/50 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        );
      })}
    </div>
  );
}
