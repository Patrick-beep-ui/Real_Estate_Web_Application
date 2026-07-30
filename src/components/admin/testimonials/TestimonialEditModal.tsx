"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, X, Upload, Trash2 } from "lucide-react";
import { TESTIMONIAL_SCENARIOS } from "@/types/testimonial";
import { useTestimonialVideoUpload } from "@/hooks/testimonials/useTestimonialVideoUpload";
import { useToast } from "@/hooks/shared/use-toast";
import type { TestimonialRow } from "@/types/testimonial";

interface Props {
  editPost: TestimonialRow | null;
  creating: boolean;
  isPending: boolean;
  onSave: (form: Record<string, unknown>) => void;
  onClose: () => void;
}

export function TestimonialEditModal({ editPost, creating, isPending, onSave, onClose }: Props) {
  const { toast } = useToast();
  const { uploadVideo, deleteVideo, uploading } = useTestimonialVideoUpload();
  const isOpen = !!editPost || creating;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [kind, setKind] = useState<"video" | "written">("written");
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [location, setLocation] = useState("");
  const [scenario, setScenario] = useState("");
  const [reason, setReason] = useState("");
  const [headline, setHeadline] = useState("");
  const [pullQuote, setPullQuote] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [videoSrc, setVideoSrc] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [rating, setRating] = useState(5);
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [marketSlug, setMarketSlug] = useState("");
  const [points, setPoints] = useState<string[]>([]);
  const [videoFileName, setVideoFileName] = useState("");
  const videoFileNameRef = useRef(videoFileName);
  useEffect(() => { videoFileNameRef.current = videoFileName; }, [videoFileName]);

  useEffect(() => {
    if (editPost) {
      setKind(editPost.kind as "video" | "written");
      setName(editPost.name);
      setBody(editPost.body);
      setLocation(editPost.location ?? "");
      setScenario(editPost.scenario ?? "");
      setReason(editPost.reason ?? "");
      setHeadline(editPost.headline ?? "");
      setPullQuote(editPost.pull_quote ?? "");
      setYoutubeId(editPost.youtube_id ?? "");
      setVideoSrc(editPost.video_src ?? "");
      setPosterUrl(editPost.poster_url ?? "");
      setRating(editPost.rating ?? 5);
      setIsFeatured(editPost.is_featured ?? false);
      setStatus(editPost.status as "draft" | "published" | "archived");
      setMarketSlug(editPost.market_slug ?? "");
    } else if (creating) {
      setKind("written");
      setName(""); setBody(""); setLocation(""); setScenario("");
      setReason(""); setHeadline(""); setPullQuote("");
      setYoutubeId(""); setVideoSrc(""); setPosterUrl("");
      setRating(5); setIsFeatured(false); setStatus("draft"); setMarketSlug("");
      setVideoFileName("");
    }
  }, [editPost, creating]);

  const handleVideoUpload = useCallback(async (file: File) => {
    try {
      const name = videoFileNameRef.current.trim() || undefined;
      const url = await uploadVideo(file, name);
      setVideoSrc(url);
      toast({ title: "Video uploaded", description: "Video URL has been set." });
    } catch (err) {
      toast({ variant: "destructive", title: "Upload failed", description: (err as Error).message });
    }
  }, [uploadVideo, toast]);

  const handleRemoveVideo = async () => {
    if (!videoSrc) return;
    try {
      await deleteVideo(videoSrc);
    } catch {}
    setVideoSrc("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleVideoUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      handleVideoUpload(file);
    }
  };

  const addPoint = () => setPoints((p) => [...p, ""]);
  const updatePoint = (i: number, v: string) => setPoints((p) => { const n = [...p]; n[i] = v; return n; });
  const removePoint = (i: number) => setPoints((p) => p.filter((_, idx) => idx !== i));

  const handleSave = () => {
    onSave({
      kind, name, body,
      location: location || null, scenario: scenario || null,
      reason: reason || null, headline: headline || null,
      pull_quote: pullQuote || null, youtube_id: youtubeId || null,
      video_src: videoSrc || null, poster_url: posterUrl || null,
      rating, is_featured: isFeatured,
      sort_order: editPost?.sort_order ?? 0,
      status, market_slug: marketSlug || null,
      points: points.filter(Boolean),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{creating ? "Create Testimonial" : "Edit Testimonial"}</DialogTitle>
          <DialogDescription>
            {creating ? "Fill in the details below." : "Edit testimonial details."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant={kind === "written" ? "default" : "outline"} size="sm" onClick={() => setKind("written")}>Written</Button>
            <Button variant={kind === "video" ? "default" : "outline"} size="sm" onClick={() => setKind("video")}>Video</Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} className="text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Scenario</Label>
              <Select value={scenario} onValueChange={setScenario}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select scenario" />
                </SelectTrigger>
                <SelectContent>
                  {TESTIMONIAL_SCENARIOS.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace(/-/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "draft" | "published" | "archived")}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft" className="text-xs">Draft</SelectItem>
                  <SelectItem value="published" className="text-xs">Published</SelectItem>
                  <SelectItem value="archived" className="text-xs">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="text-sm h-20 resize-y" />
          </div>

          {kind === "video" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Headline</Label>
                <Input value={headline} onChange={(e) => setHeadline(e.target.value)} className="text-sm" />
              </div>

              <div className="space-y-2 rounded-lg border border-border p-3">
                <Label className="text-xs font-semibold">Upload Video</Label>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">File name (optional)</Label>
                  <Input
                    value={videoFileName}
                    onChange={(e) => setVideoFileName(e.target.value)}
                    placeholder="e.g. john-doe-testimonial"
                    className="text-sm font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">If empty, saves as video-&lt;timestamp&gt;.mp4</p>
                </div>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Uploading video...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Upload className="w-6 h-6" />
                      <span className="text-sm">Drop a video here or click to browse</span>
                      <span className="text-xs">mp4, webm, mov &mdash; max 100MB</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Video Source URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={videoSrc}
                    onChange={(e) => setVideoSrc(e.target.value)}
                    className="text-sm font-mono flex-1"
                    placeholder="https://..."
                  />
                  {videoSrc && (
                    <Button variant="outline" size="sm" className="shrink-0" onClick={handleRemoveVideo}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                {videoSrc && (
                  <video src={videoSrc} controls className="w-full max-h-40 rounded-lg border border-border mt-1" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">YouTube ID</Label>
                  <Input value={youtubeId} onChange={(e) => setYoutubeId(e.target.value)} className="text-sm font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Poster URL</Label>
                  <Input value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} className="text-sm" />
                </div>
              </div>
            </>
          )}

          {kind === "written" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Pull Quote</Label>
                <Input value={pullQuote} onChange={(e) => setPullQuote(e.target.value)} className="text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Reason</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} className="text-sm" />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Rating (1\u20135)</Label>
              <Input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value))} className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Market Slug</Label>
              <Input value={marketSlug} onChange={(e) => setMarketSlug(e.target.value)} className="text-sm" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="featured" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            <Label htmlFor="featured" className="text-xs">Featured</Label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Points (key takeaways)</Label>
              <Button variant="outline" size="sm" className="h-6 text-xs" onClick={addPoint}>
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
            {points.map((p, i) => (
              <div key={i} className="flex gap-2 items-start">
                <Input value={p} onChange={(e) => updatePoint(i, e.target.value)} placeholder="Point..." className="text-sm flex-1" />
                <button onClick={() => removePoint(i)} className="p-1 text-muted-foreground hover:text-destructive mt-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending || !name || !body || uploading}>
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {creating ? "Create" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
