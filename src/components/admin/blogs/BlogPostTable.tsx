"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BlogPostRow } from "./BlogPostRow";
import type { BlogPost } from "@/types/blog";

interface BlogPostTableProps {
  posts: BlogPost[];
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  onRequestSort: (key: string) => void;
  onEdit: (post: BlogPost) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onCategoryChange: (id: string, category: string) => void;
  onRegenerateImages: (post: BlogPost) => void;
  generatingSlug: string | null;
}

export function BlogPostTable({
  posts, sortConfig, onRequestSort, onEdit, onDelete,
  onStatusChange, onCategoryChange, onRegenerateImages, generatingSlug,
}: BlogPostTableProps) {
  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === "asc"
      ? <ArrowUp className="inline w-3 h-3 ml-1" />
      : <ArrowDown className="inline w-3 h-3 ml-1" />;
  };

  return (
    <div className="rounded border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Status</TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => onRequestSort("title")}>
              Title{getSortIcon("title")}
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => onRequestSort("category")}>
              Category{getSortIcon("category")}
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => onRequestSort("words")}>
              Words{getSortIcon("words")}
            </TableHead>
            <TableHead>Images</TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => onRequestSort("published_at")}>
              Published{getSortIcon("published_at")}
            </TableHead>
            <TableHead className="w-40">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                No blog posts found
              </TableCell>
            </TableRow>
          ) : (
            posts.map((post) => (
              <BlogPostRow
                key={post.id}
                post={post}
                onStatusChange={onStatusChange}
                onCategoryChange={onCategoryChange}
                onEdit={onEdit}
                onDelete={onDelete}
                onRegenerateImages={onRegenerateImages}
                generatingSlug={generatingSlug}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
