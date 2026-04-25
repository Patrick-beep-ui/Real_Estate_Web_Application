"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Check,
  Image as ImageIcon,
  LayoutGrid,
  Loader2,
  Play,
  RefreshCw,
  Video,
  X,
} from "lucide-react";

type AdCreative = {
  id: string;
  platform: string;
  format: string;
  headline: string;
  primary_text?: string | null;
  description?: string | null;
  call_to_action?: string | null;
  image_prompt?: string | null;
  image_url?: string | null;
  brand_photo_url?: string | null;
  video_concept?: unknown;
  sitelink_extensions?: unknown;
  ab_test_group?: string | null;
  ab_test_hypothesis?: string | null;
  estimated_relevance_score?: number | null;
  status: string;
  target_audience?: string | null;
  market_slug?: string;
  situation_slug?: string;
};

type AdCreativeCardProps = {
  creative: AdCreative;
  onApprove: (id: string) => void;
  onPause: (id: string) => void;
  onRegenerate?: (id: string) => void;
  isRegenerating?: boolean;
  onClick?: () => void;
};

type CarouselCard = {
  card_number?: number;
  card_headline?: string;
  card_body?: string;
  card_image_prompt?: string;
  card_animation?: string;
};

type VideoConcept = {
  hook?: string;
  scenes?: string[];
  cta_overlay?: string;
  duration_sec?: number;
  carousel_cards?: CarouselCard[];
};

type SitelinkExtension = {
  text?: string;
  url?: string;
};

const groupClasses: Record<string, string> = {
  A: "bg-primary/15 text-primary border-primary/30",
  B: "bg-secondary text-secondary-foreground border-border",
  C: "bg-accent text-accent-foreground border-border",
};

const formatIcons: Record<string, typeof ImageIcon> = {
  image: ImageIcon,
  video_concept: Video,
  carousel: LayoutGrid,
};

const getStatusVariant = (
  status: string
): "default" | "secondary" | "destructive" => {
  if (status === "approved") return "default";
  if (status === "paused") return "destructive";
  return "secondary";
};

const parseStructuredValue = <T,>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  return value as T;
};

const extractSlides = (prompt?: string | null) => {
  if (!prompt) return [];

  const numberedSlides = prompt
    .split(/\s*\d+\.\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (numberedSlides.length > 0) return numberedSlides.slice(0, 3);

  return prompt
    .split(/\.\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
};

const summarizePrompt = (prompt?: string | null, maxLength = 120) => {
  if (!prompt) {
    return "Warm, trustworthy home-selling creative with a calm Tampa real estate vibe.";
  }

  const cleaned = prompt.replace(/\s+/g, " ").trim();
  return cleaned.length <= maxLength
    ? cleaned
    : `${cleaned.slice(0, maxLength).trimEnd()}…`;
};

const humanize = (value?: string | null) => {
  if (!value) return "";

  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

function HouseIllustration({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "relative mx-auto",
        compact ? "h-24 w-28" : "h-40 w-48"
      )}
    >
      <div className="absolute left-1/2 top-2 h-10 w-10 -translate-x-1/2 rotate-45 rounded-xl border border-border/70 bg-background/70 backdrop-blur-sm" />
      <div className="absolute left-5 top-5 h-16 w-16 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute right-4 top-4 h-20 w-20 rounded-full bg-accent/30 blur-3xl" />
      <div className="absolute bottom-1 left-1/2 h-28 w-40 -translate-x-1/2 rounded-[2rem] border border-border/70 bg-background/45 backdrop-blur-sm">
        <div className="absolute left-5 top-6 grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "rounded-md border border-border/50 bg-primary/10",
                compact ? "h-4 w-4" : "h-5 w-5"
              )}
            />
          ))}
        </div>
        <div className="absolute bottom-0 left-1/2 h-12 w-10 -translate-x-1/2 rounded-t-2xl border border-border/50 bg-background/80" />
      </div>
    </div>
  );
}

function ImageCanvas({
  creative,
  label,
  landscape = false,
}: {
  creative: AdCreative;
  label: string;
  landscape?: boolean;
}) {
  if (creative.image_url) {
    return (
      <img
        src={creative.image_url}
        alt={`${creative.platform} ${creative.format} preview for ${creative.headline}`}
        loading="lazy"
        className={cn(
          "w-full object-cover",
          landscape ? "aspect-[16/10]" : "aspect-[4/5]"
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-accent/25",
        landscape ? "aspect-[16/10]" : "aspect-[4/5]"
      )}
    >
      <div className="absolute left-4 top-4 rounded-full border border-border/60 bg-background/85 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
        {label}
      </div>
      <div className="absolute inset-x-0 top-14">
        <HouseIllustration />
      </div>
      <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-border/70 bg-background/85 p-4 backdrop-blur-sm">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Image direction
        </p>
        <p className="mt-2 text-sm font-medium leading-snug text-foreground line-clamp-4">
          {summarizePrompt(creative.image_prompt)}
        </p>
      </div>
    </div>
  );
}

function CarouselCanvas({
  creative,
  landscape = false,
}: {
  creative: AdCreative;
  landscape?: boolean;
}) {
  const video = parseStructuredValue<VideoConcept>(creative.video_concept, {});
  const cards = Array.isArray(video.carousel_cards) && video.carousel_cards.length > 0
    ? video.carousel_cards
    : null;

  // Show the AI image prominently, with carousel card count overlay
  if (creative.image_url) {
    const cardCount = cards?.length ?? 0;
    return (
      <div className={cn("relative", landscape ? "aspect-[16/10]" : "aspect-[4/5]")}>
        <img
          src={creative.image_url}
          alt={creative.headline}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {creative.brand_photo_url && (
          <img
            src={creative.brand_photo_url}
            alt="Tarek El Moussa"
            className="absolute bottom-3 left-3 h-14 w-14 rounded-full border-2 border-primary object-cover shadow-lg"
          />
        )}
        {cardCount > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm border border-border/60">
            <LayoutGrid className="h-3 w-3 text-primary" />
            {cardCount} cards
          </div>
        )}
        {cards && cards.length > 0 && (
          <div className="absolute bottom-3 right-3 flex gap-1">
            {cards.slice(0, 5).map((card, i) => (
              <div
                key={i}
                className="flex h-6 w-6 items-center justify-center rounded-md bg-background/90 text-[10px] font-bold text-foreground backdrop-blur-sm border border-border/50"
              >
                {i + 1}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // No image — show card headlines in a clean list
  if (cards) {
    return (
      <div className={cn("flex flex-col gap-0 bg-muted/20", landscape ? "aspect-[16/10]" : "aspect-[4/5]")}>
        <div className="flex items-center gap-2 px-3 pt-3 pb-1">
          <LayoutGrid className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">{cards.length}-card carousel</span>
        </div>
        <div className="flex-1 overflow-hidden px-3 pb-3 space-y-1.5">
          {cards.slice(0, 4).map((card, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-border/50 bg-card/60 px-3 py-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/15 text-[10px] font-bold text-primary">{i + 1}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{card.card_headline || `Card ${i + 1}`}</p>
                {card.card_body && (
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{card.card_body}</p>
                )}
              </div>
            </div>
          ))}
          {cards.length > 4 && (
            <p className="text-[10px] text-muted-foreground pl-7">+{cards.length - 4} more cards</p>
          )}
        </div>
      </div>
    );
  }

  // Fallback — no cards, no image
  return (
    <div className={cn("flex items-center justify-center bg-muted/20", landscape ? "aspect-[16/10]" : "aspect-[4/5]")}>
      <div className="text-center p-6">
        <HouseIllustration compact />
        <p className="mt-3 text-xs text-muted-foreground">No image or carousel data</p>
      </div>
    </div>
  );
}

function VideoCanvas({
  creative,
  landscape = false,
}: {
  creative: AdCreative;
  landscape?: boolean;
}) {
  const video = parseStructuredValue<VideoConcept>(creative.video_concept, {});
  const scenes = Array.isArray(video.scenes) ? video.scenes.slice(0, 3) : [];

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-accent/25",
        landscape ? "aspect-[16/10]" : "aspect-[4/5]"
      )}
    >
      <div className="absolute inset-x-0 top-12">
        <HouseIllustration />
      </div>
      <div className="absolute left-4 top-4 rounded-full border border-border/60 bg-background/85 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
        {video.duration_sec || 15}s video
      </div>
      {video.cta_overlay ? (
        <div className="absolute right-4 top-4 rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-[11px] font-medium text-primary backdrop-blur-sm">
          {video.cta_overlay}
        </div>
      ) : null}
      <div className="absolute left-1/2 top-[42%] flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-background/90 shadow-sm backdrop-blur-sm">
        <Play className="h-7 w-7 text-foreground" />
      </div>
      <div className="absolute inset-x-4 bottom-4 space-y-3">
        <div className="rounded-2xl border border-border/70 bg-background/88 p-4 backdrop-blur-sm">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Hook
          </p>
          <p className="mt-2 text-sm font-medium leading-snug text-foreground">
            {video.hook || creative.headline}
          </p>
        </div>
        {scenes.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {scenes.map((scene, index) => (
              <div
                key={`${creative.id}-scene-${index}`}
                className="rounded-xl border border-border/70 bg-card/85 p-2"
              >
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Scene {index + 1}
                </p>
                <p className="mt-1 text-xs leading-snug text-foreground line-clamp-3">
                  {scene}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MetaPreview({ creative }: { creative: AdCreative }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border bg-background shadow-sm">
      <div className="flex items-center gap-3 border-b border-border/60 bg-card px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
          TB
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            Tarek Buys Houses
          </p>
          <p className="text-xs text-muted-foreground">Sponsored · Meta feed ad</p>
        </div>
        <Badge variant="outline" className="ml-auto text-[11px] uppercase tracking-wide">
          Meta
        </Badge>
      </div>

      {creative.format === "video_concept" ? (
        <VideoCanvas creative={creative} />
      ) : creative.format === "carousel" ? (
        <CarouselCanvas creative={creative} />
      ) : (
        <ImageCanvas creative={creative} label="Meta feed creative" />
      )}

      <div className="space-y-3 p-4">
        <p className="text-sm leading-6 text-foreground">
          {creative.primary_text ||
            "Fast, fair cash offer with no repairs, no fees, and no open houses."}
        </p>
        <div className="rounded-2xl border border-border bg-card p-3">
          <p className="text-sm font-semibold leading-snug text-foreground">
            {creative.headline}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">
                tarekbuyshouses.com
              </p>
              <p className="text-xs text-muted-foreground">Sponsored</p>
            </div>
            <Button size="sm" className="h-8 rounded-full px-3">
              {creative.call_to_action || "Learn More"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GooglePreview({ creative }: { creative: AdCreative }) {
  const sitelinks = parseStructuredValue<SitelinkExtension[]>(
    creative.sitelink_extensions,
    []
  ).filter((link) => link?.text);

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border bg-background shadow-sm">
      <div className="border-b border-border/60 bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
            G
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              Google Ad Preview
            </p>
            <p className="text-xs text-muted-foreground">Sponsored result</p>
          </div>
          <Badge variant="outline" className="ml-auto text-[11px] uppercase tracking-wide">
            Google
          </Badge>
        </div>
      </div>

      <div className="border-b border-border/60">
        {creative.format === "video_concept" ? (
          <VideoCanvas creative={creative} landscape />
        ) : creative.format === "carousel" ? (
          <CarouselCanvas creative={creative} landscape />
        ) : (
          <ImageCanvas creative={creative} label="Google display creative" landscape />
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            tarekbuyshouses.com/{creative.situation_slug || "sell"}
          </p>
          <p className="text-base font-semibold leading-snug text-primary">
            {creative.headline}
          </p>
          <p className="text-sm leading-6 text-foreground">
            {creative.primary_text ||
              creative.description ||
              "Get a fair cash offer with no fees, no repairs, and no long listing delays."}
          </p>
        </div>

        {sitelinks.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {sitelinks.slice(0, 4).map((link, index) => (
              <div
                key={`${creative.id}-link-${index}`}
                className="rounded-xl border border-border bg-card/85 p-2"
              >
                <p className="truncate text-xs font-medium text-foreground">
                  {link.text}
                </p>
                {link.url ? (
                  <p className="truncate text-[11px] text-muted-foreground">
                    {link.url.replace(/^https?:\/\//, "")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">CTA</p>
            <p className="truncate text-xs text-muted-foreground">
              {creative.call_to_action || "Get Offer"}
            </p>
          </div>
          <Button size="sm" className="h-8 rounded-full px-3">
            {creative.call_to_action || "Get Offer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

const statusDotColors: Record<string, string> = {
  approved: "bg-green-500",
  draft: "bg-yellow-500",
  paused: "bg-red-500",
  exported: "bg-blue-500",
};

export function AdCreativeCard({
  creative,
  onApprove,
  onPause,
  onRegenerate,
  isRegenerating,
  onClick,
}: AdCreativeCardProps) {
  const FormatIcon = formatIcons[creative.format] || ImageIcon;
  const groupClass = groupClasses[creative.ab_test_group || "A"] || groupClasses.A;
  const market = humanize(creative.market_slug);
  const situation = humanize(creative.situation_slug);

  return (
    <Card
      className="cursor-pointer overflow-hidden border-border/80 bg-card/85 backdrop-blur-sm transition-shadow hover:shadow-lg"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-block h-2.5 w-2.5 rounded-full",
                statusDotColors[creative.status] || "bg-muted"
              )}
            />
            <Badge variant="outline" className="text-[11px] uppercase tracking-wide">
              {creative.platform}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FormatIcon className="h-3.5 w-3.5" />
              <span>{creative.format.replace(/_/g, " ")}</span>
            </div>
          </div>
          <Badge variant="outline" className={cn("border text-[11px]", groupClass)}>
            Group {creative.ab_test_group || "A"}
          </Badge>
        </div>

        <div className="p-4">
          {creative.platform === "google" ? (
            <GooglePreview creative={creative} />
          ) : (
            <MetaPreview creative={creative} />
          )}

          <div className="mt-4 space-y-3">
            {/* Image quality badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              {creative.image_url ? (
                <Badge variant="outline" className="text-[10px] border-green-500/40 text-green-500">
                  AI Scene ✓
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] border-yellow-500/40 text-yellow-500">
                  No Image
                </Badge>
              )}
              {creative.brand_photo_url && (
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                  Brand Photo ✓
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getStatusVariant(creative.status)} className="text-[11px]">
                {creative.status}
              </Badge>
              {creative.estimated_relevance_score != null ? (
                <span className="text-xs text-muted-foreground">
                  Score {creative.estimated_relevance_score}/10
                </span>
              ) : null}
              {market && situation ? (
                <span className="text-xs text-muted-foreground">
                  {market} · {situation}
                </span>
              ) : null}
            </div>

            {creative.target_audience ? (
              <p className="text-sm text-muted-foreground">
                Audience: {creative.target_audience}
              </p>
            ) : null}

            {creative.ab_test_hypothesis ? (
              <p className="text-sm italic text-muted-foreground">
                Hypothesis: {creative.ab_test_hypothesis}
              </p>
            ) : null}

            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              {creative.status === "draft" && (
                <>
                  <Button className="flex-1" onClick={() => onApprove(creative.id)}>
                    <Check className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => onPause(creative.id)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Pause
                  </Button>
                </>
              )}
              {onRegenerate && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onRegenerate(creative.id)}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-1 h-3 w-3" />
                  )}
                  Regen
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
