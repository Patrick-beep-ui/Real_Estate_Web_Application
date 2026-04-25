"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Check,
  Download,
  Loader2,
  Pause,
  RefreshCw,
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

type Props = {
  creative: AdCreative | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (id: string) => void;
  onPause: (id: string) => void;
  onRegenerate: (id: string) => void;
  isRegenerating?: boolean;
};

const statusColors: Record<string, string> = {
  approved: "bg-green-500",
  draft: "bg-yellow-500",
  paused: "bg-red-500",
  exported: "bg-blue-500",
};

const humanize = (value?: string | null) =>
  value
    ? value
        .split("-")
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ")
    : "";

export function AdCreativePreviewModal({
  creative,
  open,
  onOpenChange,
  onApprove,
  onPause,
  onRegenerate,
  isRegenerating,
}: Props) {
  if (!creative) return null;

  const video =
    creative.video_concept && typeof creative.video_concept === "object"
      ? (creative.video_concept as VideoConcept)
      : ({} as VideoConcept);

  const exportSingle = () => {
    const blob = new Blob([JSON.stringify(creative, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `creative-${creative.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span
              className={cn(
                "inline-block h-3 w-3 rounded-full",
                statusColors[creative.status] || "bg-muted"
              )}
            />
            {creative.headline}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {creative.platform.toUpperCase()} · {creative.format.replace(/_/g, " ")} · Group {creative.ab_test_group || "A"}
          </DialogDescription>
        </DialogHeader>

        {/* Meta Ad Feed Mockup */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">TB</div>
            <div>
              <p className="text-sm font-semibold text-foreground">Tarek Buys Houses</p>
              <p className="text-xs text-muted-foreground">Sponsored · Meta Feed</p>
            </div>
          </div>
          {creative.primary_text && (
            <div className="px-4 py-3 text-sm text-foreground">{creative.primary_text}</div>
          )}
          <div className="relative">
            {creative.image_url ? (
              <img src={creative.image_url} alt={creative.headline} className="w-full object-cover aspect-square" />
            ) : (
              <div className="aspect-square bg-muted/30 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No image generated yet</p>
              </div>
            )}
            {creative.brand_photo_url && (
              <img
                src={creative.brand_photo_url}
                alt="Tarek El Moussa"
                className="absolute bottom-3 left-3 w-16 h-16 rounded-full border-2 border-primary object-cover shadow-lg"
              />
            )}
          </div>
          <div className="px-4 py-3 border-t border-border">
            <p className="text-sm font-semibold text-foreground">{creative.headline}</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">tarekbuyshouses.com</p>
              <span className="text-xs font-medium text-primary">{creative.call_to_action || "Get Offer"}</span>
            </div>
          </div>
        </div>

        {/* Image prompt */}
        {!creative.image_url && creative.image_prompt && (
          <div className="space-y-1 rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Image Direction</p>
            <p className="text-sm text-muted-foreground">{creative.image_prompt}</p>
          </div>
        )}

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Platform</p>
            <p className="font-medium uppercase text-foreground">
              {creative.platform}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Format</p>
            <p className="font-medium text-foreground">
              {creative.format.replace(/_/g, " ")}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">A/B Group</p>
            <Badge variant="outline" className="mt-1">
              Group {creative.ab_test_group || "A"}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Relevance Score</p>
            <p className="font-medium text-foreground">
              {creative.estimated_relevance_score ?? "—"}/10
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Market</p>
            <p className="font-medium text-foreground">
              {humanize(creative.market_slug)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Situation</p>
            <p className="font-medium text-foreground">
              {humanize(creative.situation_slug)}
            </p>
          </div>
        </div>

        {/* Copy fields */}
        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          {creative.primary_text && (
            <div>
              <p className="text-xs text-muted-foreground">Primary Text</p>
              <p className="text-sm text-foreground">{creative.primary_text}</p>
            </div>
          )}
          {creative.description && (
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="text-sm text-foreground">{creative.description}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">CTA</p>
            <p className="text-sm font-medium text-foreground">
              {creative.call_to_action || "Get Offer"}
            </p>
          </div>
        </div>

        {/* Audience & Hypothesis */}
        {creative.target_audience && (
          <div>
            <p className="text-xs text-muted-foreground">Target Audience</p>
            <p className="text-sm text-foreground">{creative.target_audience}</p>
          </div>
        )}
        {creative.ab_test_hypothesis && (
          <div>
            <p className="text-xs text-muted-foreground">A/B Hypothesis</p>
            <p className="text-sm italic text-foreground">
              {creative.ab_test_hypothesis}
            </p>
          </div>
        )}

        {/* Video concept */}
        {creative.format === "video_concept" && video.hook && (
          <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Video Concept
            </p>
            <p className="text-sm text-foreground">Hook: {video.hook}</p>
            {video.scenes?.map((s, i) => (
              <p key={i} className="text-sm text-foreground">
                Scene {i + 1}: {s}
              </p>
            ))}
            {video.cta_overlay && (
              <p className="text-sm text-foreground">
                CTA Overlay: {video.cta_overlay}
              </p>
            )}
          </div>
        )}

        {/* Carousel cards detail */}
        {creative.format === "carousel" && video.carousel_cards && video.carousel_cards.length > 0 && (
          <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Carousel Cards ({video.carousel_cards.length})
            </p>
            <div className="space-y-2">
              {video.carousel_cards.map((card: CarouselCard, i: number) => (
                <div key={i} className="flex gap-3 rounded-lg border border-border/60 bg-card/80 p-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary">
                    {card.card_number || i + 1}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-semibold text-foreground">{card.card_headline || `Card ${i + 1}`}</p>
                    {card.card_body && (
                      <p className="text-xs text-muted-foreground">{card.card_body}</p>
                    )}
                    {card.card_animation && (
                      <p className="text-[11px] italic text-primary/70">Animation: {card.card_animation}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button
            onClick={() => onApprove(creative.id)}
            disabled={creative.status === "approved"}
          >
            <Check className="mr-2 h-4 w-4" />
            Approve
          </Button>
          <Button
            variant="outline"
            onClick={() => onPause(creative.id)}
            disabled={creative.status === "paused"}
          >
            <Pause className="mr-2 h-4 w-4" />
            Pause
          </Button>
          <Button
            variant="secondary"
            onClick={() => onRegenerate(creative.id)}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Regenerate Image
          </Button>
          <Button variant="ghost" onClick={exportSingle}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
