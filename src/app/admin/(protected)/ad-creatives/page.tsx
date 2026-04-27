"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { AdCreativeCard } from "@/components/admin/ad-creatives/AdCreativeCard";
import { AdCreativePreviewModal } from "@/components/admin/ad-creatives/AdCreativePreviewModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { MARKETS } from "@/lib/data/markets";
import { SITUATIONS } from "@/lib/data/situations";
import { Download, ImageIcon, Loader2, Play, RefreshCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";

const marketList = Object.entries(MARKETS).map(([slug, market]) => ({
  slug,
  name: market.name,
}));

const situationList = Object.entries(SITUATIONS).map(([slug, situation]) => ({
  slug,
  label: situation.label,
}));

const groupColors: Record<string, string> = {
  A: "bg-primary/15 text-primary border-primary/30",
  B: "bg-secondary text-secondary-foreground border-border",
  C: "bg-accent text-accent-foreground border-border",
};

export default function AdminAdCreatives() {
  const queryClient = useQueryClient();
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [genMarket, setGenMarket] = useState("tampa");
  const [genSituation, setGenSituation] = useState("divorce");
  const [selectedCreative, setSelectedCreative] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [autoGenRunning, setAutoGenRunning] = useState(false);
  const [autoGenProgress, setAutoGenProgress] = useState({ done: 0, total: 0 });

  const { data: creatives, isLoading } = useQuery({
    queryKey: ["ad_creatives", filterPlatform, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from("ad_creatives")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterPlatform !== "all") query = query.eq("platform", filterPlatform);
      if (filterStatus !== "all") query = query.eq("status", filterStatus);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const [genPlatform, setGenPlatform] = useState("meta");

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "generate-ad-creatives",
        {
          body: {
            market_slug: genMarket,
            situation_slug: genSituation,
            count: 6,
            platforms: [genPlatform],
          },
        }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast.success(`Generated ${data.created} carousel creatives`);
      queryClient.invalidateQueries({ queryKey: ["ad_creatives"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Generation failed");
    },
  });

  const runProductionMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "generate-ad-creatives",
        {
          body: {
            market_slug: genMarket,
            situation_slug: genSituation,
            count: 6,
            platforms: ["meta"],
            generate_images: true,
          },
        }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast.success(
        `Full production complete: ${data.created} carousels + ${data.image_generation?.generated ?? 0} images`
      );
      queryClient.invalidateQueries({ queryKey: ["ad_creatives"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Production run failed");
    },
  });

  const evolutionMutation = useMutation({
    mutationFn: async () => {
      // Evolution cycle: generate carousels that learn from past winners
      const { data, error } = await supabase.functions.invoke(
        "generate-ad-creatives",
        {
          body: {
            market_slug: genMarket,
            situation_slug: genSituation,
            count: 6,
            platforms: ["meta"],
            generate_images: true,
            quality_gate: 9.5,
          },
        }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast.success(
        `Creative Evolution complete: ${data.created} elite carousels generated${data.performance_learnings ? " with performance learning" : ""}`
      );
      queryClient.invalidateQueries({ queryKey: ["ad_creatives"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Evolution run failed");
    },
  });

  const generateImagesMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "generate-ad-images",
        { body: { max_count: 1 } }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      const generated = Number(data?.generated ?? 0);
      const remaining = Number(data?.remaining ?? 0);

      if (generated <= 0) {
        toast.error(data?.errors?.[0] || data?.message || "Image generation failed");
        return;
      }

      toast.success(
        remaining > 0
          ? `Generated ${generated} image${generated === 1 ? "" : "s"}. ${remaining} remaining — click again to continue.`
          : `Generated ${generated} image${generated === 1 ? "" : "s"}`
      );
      queryClient.invalidateQueries({ queryKey: ["ad_creatives"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Image generation failed");
    },
  });

  const startAutoGenAll = async () => {
    setAutoGenRunning(true);
    setAutoGenProgress({ done: 0, total: 0 });
    let done = 0;
    let remaining = 999;
    while (remaining > 0) {
      try {
        const { data, error } = await supabase.functions.invoke("generate-ad-images", { body: { max_count: 1 } });
        if (error) throw error;
        const generated = Number(data?.generated ?? 0);
        remaining = Number(data?.remaining ?? 0);
        if (generated <= 0) { toast.error(data?.errors?.[0] || "Failed — stopping"); break; }
        done += generated;
        setAutoGenProgress({ done, total: done + remaining });
        queryClient.invalidateQueries({ queryKey: ["ad_creatives"] });
      } catch (e: any) { toast.error(e.message || "Failed — stopping"); break; }
    }
    setAutoGenRunning(false);
    toast.success(`Auto-generation complete: ${done} images generated`);
    queryClient.invalidateQueries({ queryKey: ["ad_creatives"] });
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from("ad_creatives")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Creative ${status}`);
      queryClient.invalidateQueries({ queryKey: ["ad_creatives"] });
      if (selectedCreative?.id === id) {
        setSelectedCreative({ ...selectedCreative, status });
      }
    } catch (err: any) {
      console.error("updateStatus error:", err);
      toast.error("Update failed: " + err.message);
    }
  };

  const regenerateImage = async (id: string) => {
    setRegeneratingId(id);
    try {
      const { error: clearError } = await supabase.from("ad_creatives")
        .update({ image_url: null })
        .eq("id", id);

      if (clearError) throw clearError;

      const { data, error } = await supabase.functions.invoke(
        "generate-ad-images",
        { body: { creative_ids: [id], max_count: 1 } }
      );
      if (error) throw error;
      if (!data?.generated) {
        throw new Error(data?.errors?.[0] || data?.message || "Regeneration failed");
      }

      const { data: refreshedCreative } = await supabase
        .from("ad_creatives")
        .select("*")
        .eq("id", id)
        .single();

      if (refreshedCreative && selectedCreative?.id === id) {
        setSelectedCreative(refreshedCreative);
      }

      toast.success("Image regenerated");
      queryClient.invalidateQueries({ queryKey: ["ad_creatives"] });
    } catch (e: any) {
      toast.error(e.message || "Regeneration failed");
    } finally {
      setRegeneratingId(null);
    }
  };

  const exportCreatives = () => {
    const approved = (creatives || []).filter((c: any) => c.status === "approved");
    if (!approved.length) {
      toast.error("No approved creatives to export");
      return;
    }
    const blob = new Blob([JSON.stringify(approved, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ad-creatives-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${approved.length} creatives`);
  };

  const draftsWithoutImages = (creatives || []).filter(
    (c: any) => c.image_prompt && !c.image_url
  ).length;

  const isAnyBulkRunning =
    generateMutation.isPending ||
    runProductionMutation.isPending ||
    generateImagesMutation.isPending ||
    evolutionMutation.isPending ||
    autoGenRunning;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ad Creatives</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered ad production with real image generation
          </p>
        </div>
        <Button onClick={exportCreatives} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export Approved
        </Button>
      </div>

      {/* Production Controls */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Ad Production Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Market</label>
              <Select value={genMarket} onValueChange={setGenMarket}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {marketList.map((m) => (
                    <SelectItem key={m.slug} value={m.slug}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Situation</label>
              <Select value={genSituation} onValueChange={setGenSituation}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {situationList.map((s) => (
                    <SelectItem key={s.slug} value={s.slug}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Platform</label>
              <Select value={genPlatform} onValueChange={setGenPlatform}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meta">Meta</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={isAnyBulkRunning}
              variant="outline"
            >
              {generateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate 6 Carousels
            </Button>

            <Button
              onClick={() => generateImagesMutation.mutate()}
              disabled={isAnyBulkRunning || draftsWithoutImages === 0}
              variant="secondary"
            >
              {generateImagesMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="mr-2 h-4 w-4" />
              )}
              Generate Images ({draftsWithoutImages})
            </Button>

            <Button
              onClick={startAutoGenAll}
              disabled={isAnyBulkRunning || draftsWithoutImages === 0}
              className="bg-gradient-to-r from-green-600 to-emerald-500 border-0 text-primary-foreground"
            >
              {autoGenRunning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="mr-2 h-4 w-4" />
              )}
              {autoGenRunning
                ? `Generating... ${autoGenProgress.done}/${autoGenProgress.total}`
                : `Generate ALL Images (${draftsWithoutImages})`}
            </Button>

            <Button
              onClick={() => runProductionMutation.mutate()}
              disabled={isAnyBulkRunning}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              {runProductionMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Run Ad Production Now
            </Button>

            <Button
              onClick={() => evolutionMutation.mutate()}
              disabled={isAnyBulkRunning}
              className="bg-gradient-to-r from-amber-500 to-primary border-0 text-primary-foreground"
            >
              {evolutionMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              Run Full Creative Evolution
            </Button>
          </div>

          {isAnyBulkRunning && (
            <div className="space-y-2">
              <Progress value={autoGenRunning && autoGenProgress.total > 0 ? (autoGenProgress.done / autoGenProgress.total) * 100 : undefined} className="h-2" />
              <p className="text-xs text-muted-foreground animate-pulse">
                {autoGenRunning
                  ? `Auto-generating images: ${autoGenProgress.done} done, ${autoGenProgress.total - autoGenProgress.done} remaining...`
                  : evolutionMutation.isPending
                  ? "Running creative evolution: studying landing page → analyzing past winners → generating elite carousels..."
                  : runProductionMutation.isPending
                  ? "Running full production pipeline: landing page → leads → carousels → images..."
                  : generateImagesMutation.isPending
                  ? "Generating AI images for ad creatives..."
                  : "Generating carousel creatives with AI..."}
              </p>
            </div>
          )}

          {generateMutation.data || runProductionMutation.data ? (
            <div className="rounded bg-muted/50 p-3 text-sm">
              <p className="mb-1 font-medium text-foreground">
                ✅{" "}
                {((generateMutation.data || runProductionMutation.data) as any)?.created}{" "}
                creatives generated
              </p>
              <p className="text-muted-foreground">
                {((generateMutation.data || runProductionMutation.data) as any)?.insights}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterPlatform} onValueChange={setFilterPlatform}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="meta">Meta</SelectItem>
            <SelectItem value="google">Google</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="exported">Exported</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid / Table */}
      <Tabs defaultValue="grid">
        <TabsList>
          <TabsTrigger value="grid">Grid</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !creatives?.length ? (
            <p className="py-12 text-center text-muted-foreground">
              No creatives yet. Generate your first batch above.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {creatives.map((creative: any) => (
                <AdCreativeCard
                  key={creative.id}
                  creative={creative}
                  onApprove={(id) => updateStatus(id, "approved")}
                  onPause={(id) => updateStatus(id, "paused")}
                  onRegenerate={regenerateImage}
                  isRegenerating={regeneratingId === creative.id}
                  onClick={() => {
                    setSelectedCreative(creative);
                    setModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="table">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left font-medium">Platform</th>
                    <th className="p-3 text-left font-medium">Format</th>
                    <th className="p-3 text-left font-medium">Headline</th>
                    <th className="p-3 text-left font-medium">Group</th>
                    <th className="p-3 text-left font-medium">Image</th>
                    <th className="p-3 text-left font-medium">Score</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(creatives || []).map((creative: any) => (
                    <tr
                      key={creative.id}
                      className="cursor-pointer border-t border-border hover:bg-muted/20"
                      onClick={() => {
                        setSelectedCreative(creative);
                        setModalOpen(true);
                      }}
                    >
                      <td className="p-3">{creative.platform}</td>
                      <td className="p-3">{creative.format}</td>
                      <td className="max-w-[200px] truncate p-3">
                        {creative.headline}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={`text-xs border ${groupColors[creative.ab_test_group] || ""}`}
                        >
                          {creative.ab_test_group}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {creative.image_url ? (
                          <img
                            src={creative.image_url}
                            alt=""
                            className="h-8 w-8 rounded object-cover"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        {creative.estimated_relevance_score || "—"}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            creative.status === "approved" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {creative.status}
                        </Badge>
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          {creative.status === "draft" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={() => updateStatus(creative.id, "approved")}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-destructive"
                                onClick={() => updateStatus(creative.id, "paused")}
                              >
                                Pause
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      <AdCreativePreviewModal
        creative={selectedCreative}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onApprove={(id) => updateStatus(id, "approved")}
        onPause={(id) => updateStatus(id, "paused")}
        onRegenerate={regenerateImage}
        isRegenerating={regeneratingId === selectedCreative?.id}
      />
    </div>
  );
}
