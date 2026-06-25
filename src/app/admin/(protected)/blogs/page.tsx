"use client";

import { useState, useMemo, useCallback, useRef } from "react";
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
  Search, ExternalLink, Eye, Edit3, Trash2, Image, ArrowUp, ArrowDown, BookOpen, Loader2, ImageIcon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useBlogFilters } from "./useBlogFilters";
import { BlogCategoryFilter } from "./BlogCategoryFilter";
import { DateRangeFilter } from "../leads/DateRangeFilter";
import { useBlogImages } from "./useBlogImages";

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [cursorPos, setCursorPos] = useState<number | null>(null);
  const [replacingImageUrl, setReplacingImageUrl] = useState<string | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const {
    parseInlineImages, deleteFromStorage, uploadToStorage,
    extractStoragePath, removeImageFromContent,
  } = useBlogImages();

  const insertAtCursor = useCallback((text: string) => {
    setEditForm((f) => {
      const content = f.content || "";
      const pos = cursorPos ?? content.length;
      return { ...f, content: content.slice(0, pos) + text + content.slice(pos) };
    });
  }, [cursorPos]);

  const replaceImageUrl = useCallback((oldUrl: string, newUrl: string, alt: string) => {
    setEditForm((f) => {
      const escapedOld = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`!\\[[^\\]]*\\]\\(${escapedOld}\\)`);
      return { ...f, content: (f.content || "").replace(regex, `![${alt}](${newUrl})`) };
    });
  }, []);

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
          featured_image_url: form.featured_image_url || null,
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
    setNewImageUrl("");
    setEditForm({
      title: post.title,
      slug: post.slug,
      content: post.content || "",
      excerpt: post.excerpt || "",
      meta_description: post.meta_description || "",
      seo_title: post.seo_title || "",
      category: post.category || "",
      schema_type: post.schema_type || "Article",
      featured_image_url: post.featured_image_url || "",
      og_image_url: post.og_image_url || "",
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-foreground">
                        Content (Markdown)
                        <span className="text-muted-foreground font-normal ml-1">
                          ({wordCount(editForm.content || "").toLocaleString()} words)
                        </span>
                      </label>
                      <div className="flex items-center gap-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              title="Insert image"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-3 space-y-3" align="end">
                            <h4 className="text-xs font-semibold">Insert Image</h4>
                            <div className="space-y-2">
                              <label className="text-[10px] text-muted-foreground">Upload file</label>
                              <Input
                                type="file" accept="image/*" className="text-xs"
                                disabled={uploadingImage}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file || !editPost) return;
                                  setUploadingImage(true);
                                  try {
                                    const url = await uploadToStorage(file, editPost.slug);
                                    const alt = editPost.title || "Blog image";
                                    insertAtCursor(`\n\n![${alt}](${url})\n`);
                                    toast({ title: "Image inserted" });
                                  } catch (err) {
                                    toast({ variant: "destructive", title: "Upload failed", description: (err as Error).message });
                                  } finally {
                                    setUploadingImage(false);
                                  }
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] text-muted-foreground">Or paste URL</label>
                              <div className="flex gap-2">
                                <Input
                                  value={newImageUrl}
                                  onChange={(e) => setNewImageUrl(e.target.value)}
                                  className="text-xs font-mono flex-1 h-7"
                                  placeholder="https://..."
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && newImageUrl && editPost) {
                                      const alt = editPost.title || "Blog image";
                                      insertAtCursor(`\n\n![${alt}](${newImageUrl})\n`);
                                      setNewImageUrl("");
                                    }
                                  }}
                                />
                                <Button
                                  variant="outline" size="sm" className="h-7 text-xs"
                                  disabled={!newImageUrl || !editPost}
                                  onClick={() => {
                                    if (!newImageUrl || !editPost) return;
                                    const alt = editPost.title || "Blog image";
                                    insertAtCursor(`\n\n![${alt}](${newImageUrl})\n`);
                                    setNewImageUrl("");
                                  }}
                                >
                                  Add
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <Textarea
                      ref={contentRef}
                      value={editForm.content || ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                      onSelect={(e) => setCursorPos((e.target as HTMLTextAreaElement).selectionStart)}
                      onClick={(e) => setCursorPos((e.target as HTMLTextAreaElement).selectionStart)}
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (!file || !editPost || !file.type.startsWith("image/")) return;
                        setUploadingImage(true);
                        try {
                          const url = await uploadToStorage(file, editPost.slug);
                          const alt = editPost.title || "Blog image";
                          setCursorPos(contentRef.current?.selectionStart ?? null);
                          insertAtCursor(`\n\n![${alt}](${url})\n`);
                          toast({ title: "Image dropped and inserted" });
                        } catch (err) {
                          toast({ variant: "destructive", title: "Upload failed", description: (err as Error).message });
                        } finally {
                          setUploadingImage(false);
                        }
                      }}
                      className="text-sm font-mono min-h-[400px] resize-y"
                    />
                  </div>

                  {/* Image Management */}
                  <div className="border-t border-border pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Images</h4>

                    {/* Featured Image */}
                    <div className="space-y-2 mb-4 pb-4 border-b border-border">
                      <label className="text-xs font-medium text-foreground">Featured Image URL</label>
                      <div className="flex gap-2">
                        <Input
                          value={editForm.featured_image_url || ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, featured_image_url: e.target.value }))}
                          className="text-sm font-mono flex-1"
                          placeholder="https://..."
                        />
                        <Button
                          variant="outline" size="sm" className="shrink-0"
                          onClick={() => setEditForm((f) => ({ ...f, featured_image_url: "" }))}
                          disabled={!editForm.featured_image_url}
                        >
                          Clear
                        </Button>
                      </div>
                      <label className="text-xs text-muted-foreground">Upload new featured image</label>
                      <Input
                        type="file" accept="image/*" className="text-sm"
                        disabled={uploadingImage}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !editPost) return;
                          setUploadingImage(true);
                          try {
                            const url = await uploadToStorage(file, editPost.slug);
                            setEditForm((f) => ({ ...f, featured_image_url: url }));
                            toast({ title: "Featured image uploaded" });
                          } catch (err) {
                            toast({ variant: "destructive", title: "Upload failed", description: (err as Error).message });
                          } finally {
                            setUploadingImage(false);
                          }
                        }}
                      />
                      {editForm.featured_image_url && (
                        <img
                          src={editForm.featured_image_url}
                          alt="Featured"
                          className="w-full max-h-32 object-cover rounded-lg border border-border mt-2"
                        />
                      )}
                    </div>

                    {/* Content Images */}
                    {editForm.content && (() => {
                      const inlineImages = parseInlineImages(editForm.content);
                      if (inlineImages.length === 0) return null;
                      return (
                        <div className="mb-4 pb-4 border-b border-border">
                          <label className="text-xs font-medium text-foreground mb-2 block">
                            Content Images ({inlineImages.length})
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {inlineImages.map((img, i) => (
                              <div key={i}>
                                {replacingImageUrl === img.url ? (
                                  <div className="space-y-2 p-2 border border-border rounded-lg bg-muted/50">
                                    <p className="text-[10px] text-muted-foreground">Replace image</p>
                                    <Input
                                      type="file" accept="image/*" className="text-xs"
                                      disabled={uploadingImage}
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file || !editPost) return;
                                        setUploadingImage(true);
                                        try {
                                          const oldPath = extractStoragePath(img.url);
                                          if (oldPath) try { await deleteFromStorage(oldPath); } catch {}
                                          const newUrl = await uploadToStorage(file, editPost.slug);
                                          replaceImageUrl(img.url, newUrl, img.alt);
                                          setReplacingImageUrl(null);
                                          toast({ title: "Image replaced" });
                                        } catch (err) {
                                          toast({ variant: "destructive", title: "Replace failed", description: (err as Error).message });
                                        } finally {
                                          setUploadingImage(false);
                                        }
                                      }}
                                    />
                                    <Input
                                      className="text-xs font-mono h-7"
                                      placeholder="Or paste URL…"
                                      onKeyDown={async (e) => {
                                        if (e.key === "Enter" && (e.target as HTMLInputElement).value) {
                                          const oldPath = extractStoragePath(img.url);
                                          if (oldPath) try { await deleteFromStorage(oldPath); } catch {}
                                          replaceImageUrl(img.url, (e.target as HTMLInputElement).value, img.alt);
                                          setReplacingImageUrl(null);
                                          toast({ title: "Image replaced" });
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={() => setReplacingImageUrl(null)}
                                      className="text-[10px] text-muted-foreground hover:text-foreground"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="relative group rounded-lg border border-border overflow-hidden">
                                    <img
                                      src={img.url}
                                      alt={img.alt}
                                      className="w-full h-20 object-cover"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                      <Button
                                        variant="secondary" size="sm" className="h-6 w-6 p-0"
                                        onClick={() => setReplacingImageUrl(img.url)}
                                      >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 9l5-5 5 5M12 4v12" /></svg>
                                      </Button>
                                      <Button
                                        variant="destructive" size="sm" className="h-6 w-6 p-0"
                                        onClick={async () => {
                                          const storagePath = extractStoragePath(img.url);
                                          if (storagePath) {
                                            try { await deleteFromStorage(storagePath); } catch {}
                                          }
                                          setEditForm((f) => ({ ...f, content: removeImageFromContent(f.content || "", img.url) }));
                                          setReplacingImageUrl(null);
                                        }}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

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
