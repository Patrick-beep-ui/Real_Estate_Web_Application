import { Star } from "lucide-react";

export function StarRow({ size = "w-5 h-5" }: { size?: string }) {
  return (
    <div className="flex gap-0.5" aria-label="5 out of 5 stars">
      <Star className={`${size} text-primary fill-primary`} />
      <Star className={`${size} text-primary fill-primary`} />
      <Star className={`${size} text-primary fill-primary`} />
      <Star className={`${size} text-primary fill-primary`} />
      <Star className={`${size} text-primary fill-primary`} />
    </div>
  );
}

export function SellerBadge({
  initial,
  name,
  location,
  large = false,
}: {
  initial: string;
  name: string;
  location: string;
  large?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary ${
          large ? "h-11 w-11 text-lg" : "h-10 w-10 text-base"
        }`}
      >
        {initial}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-foreground md:text-base">{name}</span>
        <span className="text-xs text-muted-foreground md:text-sm">{location}</span>
      </div>
    </div>
  );
}
