"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function AdPlatformFilter({ value, onChange }: Props) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="All Platforms" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Platforms</SelectItem>
        <SelectItem value="ads">Ads</SelectItem>
        <SelectItem value="Google Ads">Google Ads</SelectItem>
        <SelectItem value="Meta Ads">Meta Ads</SelectItem>
        <SelectItem value="Microsoft Ads">Microsoft Ads</SelectItem>
        <SelectItem value="organic">Organic / Direct</SelectItem>
      </SelectContent>
    </Select>
  );
}
