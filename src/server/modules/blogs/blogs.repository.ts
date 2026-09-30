import { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/server/http/errors";
import { prisma } from "@/server/db/prisma";

export type AdminBlogPost = {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  excerpt: string | null;
  content: string | null;
  featured_image_url: string | null;
  author_id: string | null;
  category: string | null;
  tags: string[];
  seo_title: string | null;
  canonical_url: string | null;
  og_image_url: string | null;
  schema_type: string | null;
  status: string | null;
  ai_generated: boolean | null;
  location_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type BlogInput = {
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  metaDescription: string | null;
  seoTitle: string | null;
  category: string | null;
  schemaType: string | null;
  featuredImageUrl: string | null;
};

type BlogUpdateInput = Partial<BlogInput> & { status?: "draft" | "published" | "archived" };

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw ApiError.badRequest("Invalid blog field");
  return value;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string") throw ApiError.badRequest(`${field} is required`);
  return value;
}

function mapBlogPost(row: {
  id: string;
  slug: string;
  title: string;
  metaDescription: string | null;
  excerpt: string | null;
  content: string | null;
  featuredImageUrl: string | null;
  authorId: string | null;
  category: string | null;
  tags: string[];
  seoTitle: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  schemaType: string | null;
  status: string | null;
  aiGenerated: boolean | null;
  locationId: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): AdminBlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    meta_description: row.metaDescription,
    excerpt: row.excerpt,
    content: row.content,
    featured_image_url: row.featuredImageUrl,
    author_id: row.authorId,
    category: row.category,
    tags: row.tags,
    seo_title: row.seoTitle,
    canonical_url: row.canonicalUrl,
    og_image_url: row.ogImageUrl,
    schema_type: row.schemaType,
    status: row.status,
    ai_generated: row.aiGenerated,
    location_id: row.locationId,
    published_at: row.publishedAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export function parseBlogCreateInput(body: unknown): BlogInput {
  if (!body || typeof body !== "object") throw ApiError.badRequest("Invalid blog post");
  const input = body as Record<string, unknown>;
  return {
    title: requiredString(input.title, "title"),
    slug: requiredString(input.slug, "slug"),
    content: nullableString(input.content),
    excerpt: nullableString(input.excerpt),
    metaDescription: nullableString(input.meta_description),
    seoTitle: nullableString(input.seo_title),
    category: nullableString(input.category),
    schemaType: nullableString(input.schema_type),
    featuredImageUrl: nullableString(input.featured_image_url),
  };
}

export function parseBlogUpdateInput(body: unknown): BlogUpdateInput {
  if (!body || typeof body !== "object") throw ApiError.badRequest("Invalid blog update");
  const input = body as Record<string, unknown>;
  const update: BlogUpdateInput = {};

  if ("title" in input) update.title = requiredString(input.title, "title");
  if ("slug" in input) update.slug = requiredString(input.slug, "slug");
  if ("content" in input) update.content = nullableString(input.content);
  if ("excerpt" in input) update.excerpt = nullableString(input.excerpt);
  if ("meta_description" in input) update.metaDescription = nullableString(input.meta_description);
  if ("seo_title" in input) update.seoTitle = nullableString(input.seo_title);
  if ("category" in input) update.category = nullableString(input.category);
  if ("schema_type" in input) update.schemaType = nullableString(input.schema_type);
  if ("featured_image_url" in input) update.featuredImageUrl = nullableString(input.featured_image_url);
  if ("status" in input) {
    if (input.status !== "draft" && input.status !== "published" && input.status !== "archived") {
      throw ApiError.badRequest("Invalid blog status");
    }
    update.status = input.status;
  }

  if (Object.keys(update).length === 0) throw ApiError.badRequest("No blog fields supplied");
  return update;
}

function handlePrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw ApiError.conflict("A blog post with this slug already exists");
  }
  throw error;
}

export async function getAdminBlogs(): Promise<AdminBlogPost[]> {
  const rows = await prisma.blogPost.findMany({ orderBy: { publishedAt: "desc" } });
  return rows.map(mapBlogPost);
}

export async function getAdminBlogBySlug(slug: string): Promise<AdminBlogPost | null> {
  const row = await prisma.blogPost.findUnique({ where: { slug } });
  return row ? mapBlogPost(row) : null;
}

export async function createAdminBlog(input: BlogInput): Promise<AdminBlogPost> {
  try {
    const row = await prisma.blogPost.create({
      data: {
        ...input,
        status: "draft",
        aiGenerated: false,
      },
    });
    return mapBlogPost(row);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function updateAdminBlog(id: string, input: BlogUpdateInput): Promise<AdminBlogPost> {
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Blog post not found");

  try {
    const row = await prisma.blogPost.update({
      where: { id },
      data: {
        ...input,
        updatedAt: new Date(),
        publishedAt: input.status === "published" && !existing.publishedAt ? new Date() : undefined,
      },
    });
    return mapBlogPost(row);
  } catch (error) {
    return handlePrismaError(error);
  }
}
