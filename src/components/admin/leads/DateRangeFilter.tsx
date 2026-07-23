"use client";

import { useState } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Props = {
  value: { from?: Date; to?: Date } | undefined;
  onChange: (range: { from?: Date; to?: Date } | undefined) => void;
};

const calendarClassNames = {
  months: "flex flex-col",
  month: "space-y-3 relative",
  month_caption: "flex justify-center relative items-center h-9",
  caption_label: "text-sm font-semibold tracking-tight",
  nav: "absolute inset-x-1 top-1 flex items-center justify-between pointer-events-none z-10",
  button_previous: [
    "h-8 w-8 inline-flex items-center justify-center rounded-md pointer-events-auto",
    "border border-input bg-background text-muted-foreground",
    "hover:bg-accent hover:text-accent-foreground",
    "opacity-70 hover:opacity-100 transition-all",
  ].join(" "),
  button_next: [
    "h-8 w-8 inline-flex items-center justify-center rounded-md pointer-events-auto",
    "border border-input bg-background text-muted-foreground",
    "hover:bg-accent hover:text-accent-foreground",
    "opacity-70 hover:opacity-100 transition-all",
  ].join(" "),
  month_grid: "w-full border-collapse",
  weekdays: "flex mb-1",
  weekday: "text-muted-foreground w-9 font-medium text-[0.7rem] text-center uppercase tracking-wider",
  week: "flex w-full",
  day: "relative p-0 text-center",
  day_button: [
    "h-9 w-9 p-0 inline-flex items-center justify-center rounded-md text-sm font-normal",
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "hover:bg-accent hover:text-accent-foreground",
  ].join(" "),
  selected: [
    "[&>button]:bg-primary [&>button]:text-primary-foreground",
    "[&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
  ].join(" "),
  today: "[&>button]:ring-1 [&>button]:ring-primary/60 [&>button]:font-semibold",
  outside: "opacity-30 [&>button]:cursor-default [&>button]:pointer-events-none",
  disabled: "opacity-20 [&>button]:cursor-not-allowed [&>button]:pointer-events-none",
};

const calendarComponents = {
  Chevron: ({ orientation }: { orientation?: string }) =>
    orientation === "left" ? (
      <ChevronLeft className="h-3.5 w-3.5" />
    ) : (
      <ChevronRight className="h-3.5 w-3.5" />
    ),
};

function DateInput({
  label,
  value,
  onChange,
  disabled,
  defaultMonth,
}: {
  label: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  disabled?: { before: Date };
  defaultMonth?: Date;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <span className={value ? "text-foreground" : "text-muted-foreground"}>
              {value ? format(value, "dd/MM/yyyy") : "DD/MM/YYYY"}
            </span>
            <CalendarIcon className="h-4 w-4 opacity-50 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 overflow-hidden" align="start" side="bottom">
          <DayPicker
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange(date ?? undefined);
              setOpen(false);
            }}
            defaultMonth={defaultMonth ?? value}
            disabled={disabled}
            numberOfMonths={1}
            showOutsideDays
            className="p-4"
            classNames={calendarClassNames}
            components={calendarComponents}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function DateRangeFilter({ value, onChange }: Props) {
  const label =
    value?.from && value?.to
      ? `${format(value.from, "MMM d, yyyy")} – ${format(value.to, "MMM d, yyyy")}`
      : value?.from
      ? format(value.from, "MMM d, yyyy")
      : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-60" />
          {label ? (
            <span className="truncate text-sm">{label}</span>
          ) : (
            <span className="text-muted-foreground text-sm">Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[240px] p-4 space-y-3" align="start">
        <DateInput
          label="From"
          value={value?.from}
          onChange={(from) =>
            onChange(from ? { ...value, from } : value?.to ? { to: value.to } : undefined)
          }
        />
        <DateInput
          label="To"
          value={value?.to}
          disabled={value?.from ? { before: value.from } : undefined}
          defaultMonth={value?.from}
          onChange={(to) =>
            onChange(to ? { ...value, to } : value?.from ? { from: value.from } : undefined)
          }
        />
        {(value?.from || value?.to) && (
          <button
            onClick={() => onChange(undefined)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center pt-1"
          >
            Clear
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
