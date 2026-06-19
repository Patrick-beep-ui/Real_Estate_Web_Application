"use client";

import { useState } from "react";
import Link from "next/link";
import { useBlogPosts, useBlogCategories } from "@/hooks/useBlogPosts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeInView } from "@/components/blog/FadeInView";
import { FileText, ArrowRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import FinalCTA from "@/components/FinalCTA";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

const POSTS_PER_PAGE = 18;

const formatCategoryLabel = (category: string | null): string => {
  if (!category) return "";
  const labels: Record<string, string> = {
    "seller-guides": "Seller Guides",
    "tips-advice": "Tips & Advice",
    "market-insights": "Market Insights",
    "success-stories": "Success Stories",
    guides: "Guides",
  };
  return labels[category] || category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function BlogIndex() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { data: posts = [], isLoading } = useBlogPosts(
    activeCategory === "all" ? undefined : activeCategory,
  );
  const { data: categoryValues = [] } = useBlogCategories();

  const categories = [
    { value: "all", label: "All Posts" },
    ...categoryValues.map((cat) => ({
      value: cat,
      label: cat.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    })),
  ];

  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = posts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <main>
        {/* Hero */}
        <section className="bg-muted/30 py-16 lg:py-20">
          <div className="container mx-auto px-4 text-center">
            <FadeInView>
              <p className="text-accent font-semibold text-sm uppercase tracking-wider mb-3">
                Real Estate Insights
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
                Learn From 20+ Years of Experience
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Expert advice on selling your home fast, navigating difficult situations,
                and getting the best value for your property.
              </p>
            </FadeInView>
          </div>
        </section>

        {/* Category Filter */}
        <section className="pt-8 pb-4">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => handleCategoryChange(cat.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === cat.value
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Grid */}
        <section className="py-8 pb-16">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-card rounded-xl overflow-hidden border border-border/30">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-6 space-y-3">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Coming Soon
                </h2>
                <p className="text-muted-foreground mb-6">
                  We&apos;re working on helpful guides and insights. Check back soon!
                </p>
                <Button asChild>
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {paginatedPosts.map((post, index) => (
                    <FadeInView key={post.id} delay={index * 0.05}>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="group block bg-card rounded-xl overflow-hidden border border-border/30 hover:shadow-lg transition-all duration-300"
                      >
                        {post.featured_image_url ? (
                          <img
                            src={post.featured_image_url}
                            alt={post.title}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-muted flex items-center justify-center">
                            <FileText className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge variant="outline">
                              {formatCategoryLabel(post.category)}
                            </Badge>
                            {post.published_at && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(post.published_at), "MMM d, yyyy")}
                              </span>
                            )}
                          </div>
                          <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-accent transition-colors line-clamp-2">
                            {post.title}
                          </h2>
                          {post.excerpt && (
                            <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                              {post.excerpt}
                            </p>
                          )}
                          <span className="text-accent font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                            Read More <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </Link>
                    </FadeInView>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-12">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => handlePageChange(currentPage - 1)}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => handlePageChange(currentPage + 1)}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <FinalCTA />
      </main>
    </div>
  );
}
