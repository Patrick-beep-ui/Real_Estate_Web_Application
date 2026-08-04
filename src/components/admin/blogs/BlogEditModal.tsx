"use client";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BlogMarkdown } from "@/lib/blog/markdown";
import { BlogFAQ } from "@/components/blog/BlogFAQ";
import { resolveContent, extractFAQItems, stripFAQFromContent } from "@/lib/blog/utils";
import { useToast } from "@/hooks/shared/use-toast";
import {
  ImageIcon, Loader2, Wand2, Trash2,
} from "lucide-react";
import { CATEGORIES, CATEGORY_LABELS, SCHEMA_TYPES } from "@/types/blog";
import type { BlogPost } from "@/types/blog";

type EditorShape = {
  editPost: BlogPost | null;
  creating: boolean;
  editForm: Partial<BlogPost> & { content: string };
  setEditForm: React.Dispatch<React.SetStateAction<Partial<BlogPost> & { content: string }>>;
  slugManuallyEdited: boolean;
  setSlugManuallyEdited: React.Dispatch<React.SetStateAction<boolean>>;
  cursorPos: number | null;
  setCursorPos: React.Dispatch<React.SetStateAction<number | null>>;
  contentRef: React.RefObject<HTMLTextAreaElement | null>;
  newImageUrl: string;
  setNewImageUrl: React.Dispatch<React.SetStateAction<string>>;
  replacingImageUrl: string | null;
  setReplacingImageUrl: React.Dispatch<React.SetStateAction<string | null>>;
  uploadingImage: boolean;
  setUploadingImage: React.Dispatch<React.SetStateAction<boolean>>;
  isEmpty: boolean;
  isPending: boolean;
  uploadToStorage: (file: File, slug: string) => Promise<string>;
  parseInlineImages: (content: string) => { alt: string; url: string }[];
  extractStoragePath: (url: string) => string | null;
  deleteFromStorage: (filePath: string) => Promise<void>;
  removeImageFromContent: (content: string, urlToRemove: string) => string;
  insertAtCursor: (text: string) => void;
  replaceImageUrl: (oldUrl: string, newUrl: string, alt: string) => void;
  close: () => void;
  handleSave: () => void;
  generateBlogWithAI: {
    mutate: (args: { title: string; category?: string }, options?: { onSuccess?: () => void }) => void;
    isPending: boolean;
  };
};

interface BlogEditModalProps {
  editor: EditorShape;
}

function wordCount(content: string | null) {
  if (!content) return 0;
  return content.split(/\s+/).length;
}

export function BlogEditModal({ editor }: BlogEditModalProps) {
  const { toast } = useToast();

  const {
    editPost, creating, editForm, setEditForm,
    slugManuallyEdited, setSlugManuallyEdited,
    cursorPos, setCursorPos, contentRef,
    newImageUrl, setNewImageUrl,
    replacingImageUrl, setReplacingImageUrl,
    uploadingImage, setUploadingImage,
    isEmpty, isPending,
    uploadToStorage, parseInlineImages, extractStoragePath,
    deleteFromStorage, removeImageFromContent,
    insertAtCursor, replaceImageUrl,
    close, handleSave, generateBlogWithAI,
  } = editor;

  const isOpen = !!editPost || creating;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col">
        {(editPost || creating) && (
          <>
            <DialogHeader>
              <DialogTitle>{creating ? "Create Blog Post" : "Edit Blog Post"}</DialogTitle>
              <DialogDescription>
                {creating
                  ? "Fill in the details below. You can also use AI to generate the content automatically."
                  : "Edit content and metadata. Changes are saved when you click \"Save Changes\"."
                }
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
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      setEditForm((f) => ({ ...f, slug: e.target.value }));
                    }}
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
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Insert image">
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
                                if (!file) return;
                                setUploadingImage(true);
                                try {
                                  const url = await uploadToStorage(file, editPost?.slug || editForm.slug || "new-post");
                                  const alt = editPost?.title || editForm.title || "Blog image";
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
                                  if (e.key === "Enter" && newImageUrl) {
                                    const alt = editPost?.title || editForm.title || "Blog image";
                                    insertAtCursor(`\n\n![${alt}](${newImageUrl})\n`);
                                    setNewImageUrl("");
                                  }
                                }}
                              />
                              <Button
                                variant="outline" size="sm" className="h-7 text-xs"
                                disabled={!newImageUrl}
                                onClick={() => {
                                  const alt = editPost?.title || editForm.title || "Blog image";
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
                      if (!file || !file.type.startsWith("image/")) return;
                      setUploadingImage(true);
                      try {
                        const url = await uploadToStorage(file, editPost?.slug || editForm.slug || "new-post");
                        const alt = editPost?.title || editForm.title || "Blog image";
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
                        if (!file) return;
                        setUploadingImage(true);
                        try {
                          const url = await uploadToStorage(file, editPost?.slug || editForm.slug || "new-post");
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
                                      if (!file) return;
                                      setUploadingImage(true);
                                      try {
                                        const oldPath = extractStoragePath(img.url);
                                        if (oldPath) try { await deleteFromStorage(oldPath); } catch {}
                                        const newUrl = await uploadToStorage(file, editPost?.slug || editForm.slug || "new-post");
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
                <BlogMarkdown content={stripFAQFromContent(resolveContent(editForm.content || ""))} />
                {editForm.content && (() => {
                  const resolved = resolveContent(editForm.content);
                  const items = extractFAQItems(resolved);
                  if (items.length === 0) return null;
                  return (
                    <div className="mt-8">
                      <BlogFAQ faqItems={items} postTitle={editPost?.title || ""} />
                    </div>
                  );
                })()}
              </div>
            </div>
            <DialogFooter className="border-t border-border pt-4 mt-4">
              <Button variant="outline" onClick={close}>
                Cancel
              </Button>
              {creating && (
                <Button
                  variant="secondary"
                  onClick={() => generateBlogWithAI.mutate({
                    title: editForm.title || "",
                    category: editForm.category || undefined,
                  })}
                  disabled={!editForm.title || generateBlogWithAI.isPending}
                >
                  {generateBlogWithAI.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Wand2 className="w-4 h-4 mr-2" />
                  )}
                  Generate with AI
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={isPending || isEmpty}
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {creating ? "Create Post" : "Save Changes"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
