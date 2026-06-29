"use client";

import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { BookOpen, ExternalLink, Edit3, Trash2, Image, Loader2 } from "lucide-react";
import { CATEGORIES, CATEGORY_LABELS } from "@/types/blog";
import type { BlogPost } from "@/types/blog";

type BlogPostRowProps = {
  post: BlogPost;
  onStatusChange: (id: string, status: string) => void;
  onCategoryChange: (id: string, category: string) => void;
  onEdit: (post: BlogPost) => void;
  onDelete: (id: string) => void;
  onRegenerateImages: (post: BlogPost) => void;
  generatingSlug: string | null;
};

function wordCount(content: string | null) {
  if (!content) return 0;
  return content.split(/\s+/).length;
}

function readTime(content: string | null) {
  return Math.max(1, Math.ceil(wordCount(content) / 200));
}

export function BlogPostRow({
  post, onStatusChange, onCategoryChange, onEdit, onDelete,
  onRegenerateImages, generatingSlug,
}: BlogPostRowProps) {
  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={post.status === "published"}
            onCheckedChange={(checked) => onStatusChange(post.id, checked ? "published" : "draft")}
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
          onValueChange={(value) => onCategoryChange(post.id, value)}
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
            onClick={() => onRegenerateImages(post)}
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
                month: "short", day: "numeric", year: "numeric",
              })
            : "\u2014"}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="sm" className="h-7 w-7 p-0"
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
          <Button
            variant="ghost" size="sm" className="h-7 w-7 p-0"
            title="Edit"
            onClick={() => onEdit(post)}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            title="Archive"
            onClick={() => onDelete(post.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
