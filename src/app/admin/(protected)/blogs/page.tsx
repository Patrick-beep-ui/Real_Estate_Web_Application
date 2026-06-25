"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Search, ExternalLink, Eye, Edit3, Trash2, Image, ArrowUp, ArrowDown, BookOpen, Loader2,
} from "lucide-react";
import { useBlogFilters } from "./useBlogFilters";
import { BlogCategoryFilter } from "./BlogCategoryFilter";
import { DateRangeFilter } from "../leads/DateRangeFilter";

const CATEGORIES = [
  "seller-guides", "market-trends", "cash-offers", "real-estate-tips", "local-insights",
] as const;

const SCHEMA_TYPES = ["Article", "HowTo", "FAQPage", "BlogPosting"] as const;

const CATEGORY_LABELS: Record<string, string> = {
  "seller-guides": "Seller Guides",
  "market-trends": "Market Trends",
  "cash-offers": "Cash Offers",
  "real-estate-tips": "Real Estate Tips",
  "local-insights": "Local Insights",
};

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  meta_description: string | null;
  seo_title: string | null;
  featured_image_url: string | null;
  og_image_url: string | null;
  category: string | null;
  schema_type: string | null;
  status: string | null;
  ai_generated: boolean | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  tags: string[] | null;
  canonical_url: string | null;
  author_id: string | null;
  location_id: string | null;
}

const AdminBlogs = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);
  const [editPost, setEditPost] = useState<BlogPost | null>(null);
  const [editForm, setEditForm] = useState<Partial<BlogPost> & { content: string }>({ content: "" });
  const [generatingSlug, setGeneratingSlug] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-blogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data || []) as BlogPost[];
    },
  });

  const { filteredPosts, search, setSearch, filterCategory, setFilterCategory, dateRange, setDateRange } = useBlogFilters(posts);

  const sortedPosts = useMemo(() => {
    const sorted = [...filteredPosts];
    if (sortConfig) {
      sorted.sort((a, b) => {
        let aVal: any;
        let bVal: any;
        switch (sortConfig.key) {
          case "title":
            aVal = (a.title || "").toLowerCase();
            bVal = (b.title || "").toLowerCase();
            break;
          case "category":
            aVal = (a.category || "").toLowerCase();
            bVal = (b.category || "").toLowerCase();
            break;
          case "status":
            aVal = a.status || "";
            bVal = b.status || "";
            break;
          case "published_at":
            aVal = a.published_at ? new Date(a.published_at).getTime() : 0;
            bVal = b.published_at ? new Date(b.published_at).getTime() : 0;
            break;
          case "words":
            aVal = a.content ? a.content.split(/\s+/).length : 0;
            bVal = b.content ? b.content.split(/\s+/).length : 0;
            break;
          default:
            return 0;
        }
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [filteredPosts, sortConfig]);

  const allCategories = useMemo(() => {
    const staticList = CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] || c }));
    if (!posts) return staticList;
    const dbSet = new Set(posts.map((p) => p.category).filter((c): c is string => !!c));
    const dynamic = Array.from(dbSet).map((value) => {
      const known = staticList.find((s) => s.value === value);
      return known ?? { value, label: value };
    });
    const seen = new Set(dynamic.map((c) => c.value));
    return [...dynamic, ...staticList.filter((s) => !seen.has(s.value))];
  }, [posts]);

  const requestSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc" ? { key, direction: "desc" } : null;
      }
      return { key, direction: "asc" };
    });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === "asc"
      ? <ArrowUp className="inline w-3 h-3 ml-1" />
      : <ArrowDown className="inline w-3 h-3 ml-1" />;
  };

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("blog_posts")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      if (status === "published") {
        const existing = posts?.find((p) => p.id === id);
        if (existing && !existing.published_at) {
          await supabase
            .from("blog_posts")
            .update({ published_at: new Date().toISOString() })
            .eq("id", id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      toast({ title: "Status updated" });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Error", description: (err as Error).message });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, category }: { id: string; category: string }) => {
      const { error } = await supabase
        .from("blog_posts")
        .update({ category, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      toast({ title: "Category updated" });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Error", description: (err as Error).message });
    },
  });

  const saveEdit = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: typeof editForm }) => {
      const { error } = await supabase
        .from("blog_posts")
        .update({
          title: form.title,
          slug: form.slug,
          content: form.content,
          excerpt: form.excerpt,
          meta_description: form.meta_description,
          seo_title: form.seo_title,
          category: form.category,
          schema_type: form.schema_type,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      setEditPost(null);
      toast({ title: "Blog post saved" });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Error", description: (err as Error).message });
    },
  });

  const softDelete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("blog_posts")
        .update({ status: "archived", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      setDeleteConfirm(null);
      toast({ title: "Blog archived" });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Error", description: (err as Error).message });
    },
  });

  const regenerateImages = useCallback(async (blog: BlogPost) => {
    setGeneratingSlug(blog.slug);
    try {
      const res = await fetch(
        "https://mcgzyxrozhogzmohyfos.supabase.co/functions/v1/generate-blog-images",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ blogSlug: blog.slug, mode: "auto" }),
        }
      );
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || "Image generation failed");
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      toast({ title: `Generated ${result.images?.length || 0} images for "${blog.title}"` });
    } catch (err) {
      toast({ variant: "destructive", title: "Image generation failed", description: (err as Error).message });
    } finally {
      setGeneratingSlug(null);
    }
  }, [queryClient, toast]);

  const openEdit = (post: BlogPost) => {
    setEditPost(post);
    setEditForm({
      title: post.title,
      slug: post.slug,
      content: post.content || "",
      excerpt: post.excerpt || "",
      meta_description: post.meta_description || "",
      seo_title: post.seo_title || "",
      category: post.category || "",
      schema_type: post.schema_type || "Article",
    });
  };

  const handleSaveEdit = () => {
    if (!editPost) return;
    saveEdit.mutate({ id: editPost.id, form: editForm });
  };

  const stats = useMemo(() => {
    if (!filteredPosts) return { total: 0, published: 0, draft: 0, archived: 0, totalImages: 0 };
    return {
      total: filteredPosts.length,
      published: filteredPosts.filter((p) => p.status === "published").length,
      draft: filteredPosts.filter((p) => p.status === "draft").length,
      archived: filteredPosts.filter((p) => p.status === "archived").length,
      totalImages: filteredPosts.filter((p) => p.featured_image_url).length,
    };
  }, [filteredPosts]);

  const wordCount = (content: string | null) => {
    if (!content) return 0;
    return content.split(/\s+/).length;
  };

  const readTime = (content: string | null) => {
    return Math.max(1, Math.ceil(wordCount(content) / 200));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Blog Management</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Posts" value={stats.total.toString()} />
        <StatCard label="Published" value={stats.published.toString()} color="text-green-500" />
        <StatCard label="Drafts" value={stats.draft.toString()} color="text-yellow-500" />
        <StatCard label="Archived" value={stats.archived.toString()} color="text-muted-foreground" />
        <StatCard label="With Images" value={stats.totalImages.toString()} icon={<Image className="w-3 h-3" />} />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, slug, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-4">
          <BlogCategoryFilter value={filterCategory} onChange={setFilterCategory} categories={allCategories} />
          <DateRangeFilter value={dateRange} onChange={(range) => setDateRange(range ?? {})} />
      </div>
      </div>


      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Status</TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => requestSort("title")}>
                  Title{getSortIcon("title")}
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => requestSort("category")}>
                  Category{getSortIcon("category")}
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => requestSort("words")}>
                  Words{getSortIcon("words")}
                </TableHead>
                <TableHead>Images</TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => requestSort("published_at")}>
                  Published{getSortIcon("published_at")}
                </TableHead>
                <TableHead className="w-40">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    No blog posts found
                  </TableCell>
                </TableRow>
              ) : (
                sortedPosts.map((post) => (
                  <TableRow key={post.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={post.status === "published"}
                          onCheckedChange={(checked) =>
                            updateStatus.mutate({ id: post.id, status: checked ? "published" : "draft" })
                          }
                          disabled={post.status === "archived"}
                        />
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            post.status === "published"
                              ? "border-green-500/40 text-green-500"
                              : post.status === "draft"
                              ? "border-yellow-500/40 text-yellow-500"
                              : "border-muted-foreground/40 text-muted-foreground"
                          }`}
                        >
                          {post.status || "draft"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <div className="font-medium text-sm text-foreground truncate max-w-[300px]">
                            {post.title}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[300px]">
                            /blog/{post.slug}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={post.category || ""}
                        onValueChange={(value) => updateCategory.mutate({ id: post.id, category: value })}
                      >
                        <SelectTrigger className="h-7 text-xs w-[140px]">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat} className="text-xs">
                              {CATEGORY_LABELS[cat] || cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {wordCount(post.content).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50 ml-1">
                        ({readTime(post.content)} min)
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Image className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {post.featured_image_url ? "1+" : "0"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-[10px]"
                          onClick={() => regenerateImages(post)}
                          disabled={generatingSlug === post.slug}
                        >
                          {generatingSlug === post.slug ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Generate"
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title={post.status === "published" ? "View on site" : "Preview draft"}
                          onClick={() =>
                            window.open(
                              post.status === "published"
                                ? `/blog/${post.slug}`
                                : `/admin/blog/${post.slug}`,
                              "_blank"
                            )
                          }
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                        {/* Preview and Edit buttons 
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="Preview"
                          onClick={() => setPreviewPost(post)}
                        >
                        <Eye className="w-3.5 h-3.5" />
                        </Button>
                        */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="Edit"
                          onClick={() => openEdit(post)}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          title="Archive"
                          onClick={() => setDeleteConfirm(post.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewPost} onOpenChange={(open) => !open && setPreviewPost(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {previewPost && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{previewPost.title}</DialogTitle>
                <DialogDescription className="space-y-1">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {previewPost.category && (
                      <Badge variant="outline" className="text-[10px]">
                        {CATEGORY_LABELS[previewPost.category] || previewPost.category}
                      </Badge>
                    )}
                    {previewPost.schema_type && (
                      <Badge variant="outline" className="text-[10px]">
                        {previewPost.schema_type}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        previewPost.status === "published"
                          ? "border-green-500/40 text-green-500"
                          : "border-yellow-500/40 text-yellow-500"
                      }`}
                    >
                      {previewPost.status}
                    </Badge>
                    <span className="text-muted-foreground">
                      {wordCount(previewPost.content).toLocaleString()} words · {readTime(previewPost.content)} min read
                    </span>
                  </div>
                  {previewPost.excerpt && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      {previewPost.excerpt}
                    </p>
                  )}
                  {previewPost.meta_description && (
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      <span className="font-medium">SEO:</span> {previewPost.meta_description}
                    </p>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="border-t border-border pt-4 mt-2">
                {previewPost.seo_title && (
                  <p className="text-xs text-muted-foreground mb-2">
                    <span className="font-medium">SEO Title:</span> {previewPost.seo_title}
                  </p>
                )}
                {previewPost.featured_image_url && (
                  <img
                    src={previewPost.featured_image_url}
                    alt={previewPost.title}
                    className="w-full max-h-64 object-cover rounded-lg mb-4"
                  />
                )}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {previewPost.content || ""}
                  </ReactMarkdown>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editPost} onOpenChange={(open) => !open && setEditPost(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          {editPost && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Blog Post</DialogTitle>
                <DialogDescription>
                  Edit content and metadata. Changes are saved when you click "Save Changes".
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
                {/* Left: Editor */}
                <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Title</label>
                    <Input
                      value={editForm.title || ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Slug</label>
                    <Input
                      value={editForm.slug || ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))}
                      className="text-sm font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">Category</label>
                      <Select
                        value={editForm.category || ""}
                        onValueChange={(value) => setEditForm((f) => ({ ...f, category: value }))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat} className="text-xs">
                              {CATEGORY_LABELS[cat] || cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">Schema Type</label>
                      <Select
                        value={editForm.schema_type || "Article"}
                        onValueChange={(value) => setEditForm((f) => ({ ...f, schema_type: value }))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SCHEMA_TYPES.map((t) => (
                            <SelectItem key={t} value={t} className="text-xs">
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">
                      SEO Title
                      <span className="text-muted-foreground font-normal ml-1">
                        ({60 - (editForm.seo_title?.length || 0)} chars left)
                      </span>
                    </label>
                    <Input
                      value={editForm.seo_title || ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, seo_title: e.target.value }))}
                      className={`text-sm ${(editForm.seo_title?.length || 0) > 60 ? "border-destructive" : ""}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">
                      Meta Description
                      <span className="text-muted-foreground font-normal ml-1">
                        ({155 - (editForm.meta_description?.length || 0)} chars left)
                      </span>
                    </label>
                    <Textarea
                      value={editForm.meta_description || ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, meta_description: e.target.value }))}
                      className={`text-sm h-16 resize-none ${(editForm.meta_description?.length || 0) > 155 ? "border-destructive" : ""}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Excerpt</label>
                    <Textarea
                      value={editForm.excerpt || ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, excerpt: e.target.value }))}
                      className="text-sm h-16 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">
                      Content (Markdown)
                      <span className="text-muted-foreground font-normal ml-1">
                        ({wordCount(editForm.content || "").toLocaleString()} words)
                      </span>
                    </label>
                    <Textarea
                      value={editForm.content || ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                      className="text-sm font-mono min-h-[400px] resize-y"
                    />
                  </div>
                </div>
                {/* Right: Preview */}
                <div className="flex-1 border-l border-border pl-4 overflow-y-auto">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Preview</h3>
                  {editForm.featured_image_url && (
                    <img
                      src={editForm.featured_image_url}
                      alt=""
                      className="w-full max-h-40 object-cover rounded-lg mb-3"
                    />
                  )}
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {editForm.content || "*No content*"}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
              <DialogFooter className="border-t border-border pt-4 mt-4">
                <Button variant="outline" onClick={() => setEditPost(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={saveEdit.isPending}
                >
                  {saveEdit.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive Blog Post</DialogTitle>
            <DialogDescription>
              This will set the post to "archived" status. It will be hidden from the public site but
              the data will be preserved. You can restore it later by changing the status back.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && softDelete.mutate(deleteConfirm)}
              disabled={softDelete.isPending}
            >
              {softDelete.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Archive Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function StatCard({
  label, value, color, icon,
}: {
  label: string; value: string; color?: string; icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <div className={`text-xl font-bold ${color || "text-foreground"}`}>{value}</div>
    </div>
  );
}

export default AdminBlogs;
