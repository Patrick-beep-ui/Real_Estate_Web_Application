"use client";

import { ArrowUp, ArrowDown, Star } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TestimonialRow } from "@/types/testimonial";

interface Props {
  posts: TestimonialRow[];
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  onRequestSort: (key: string) => void;
  onEdit: (post: TestimonialRow) => void;
  onDelete: (id: string) => void;
  onToggleFeatured: (id: string) => void;
}

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    published: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950",
    draft: "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950",
    archived: "text-muted-foreground bg-muted",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[status] || colors.draft}`}>
      {status}
    </span>
  );
};

export function TestimonialTable({ posts, sortConfig, onRequestSort, onEdit, onDelete, onToggleFeatured }: Props) {
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
            <TableHead className="cursor-pointer select-none" onClick={() => onRequestSort("name")}>
              Name{getSortIcon("name")}
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => onRequestSort("kind")}>
              Kind{getSortIcon("kind")}
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => onRequestSort("scenario")}>
              Scenario{getSortIcon("scenario")}
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => onRequestSort("status")}>
              Status{getSortIcon("status")}
            </TableHead>
            <TableHead className="w-16 text-center">Featured</TableHead>
            <TableHead className="w-32">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((t) => (
            <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onEdit(t)}>
              <TableCell className="font-medium">{t.name}</TableCell>
              <TableCell className="capitalize">{t.kind}</TableCell>
              <TableCell className="capitalize">{t.scenario || "\u2014"}</TableCell>
              <TableCell>{statusBadge(t.status)}</TableCell>
              <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onToggleFeatured(t.id)}
                  className={`p-1 rounded hover:bg-muted ${t.is_featured ? "text-yellow-500" : "text-muted-foreground"}`}
                  title={t.is_featured ? "Unset featured" : "Set as featured"}
                >
                  <Star className={`w-4 h-4 ${t.is_featured ? "fill-current" : ""}`} />
                </button>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onDelete(t.id)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Delete
                  </button>
              </TableCell>
            </TableRow>
          ))}
          {posts.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No testimonials found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
