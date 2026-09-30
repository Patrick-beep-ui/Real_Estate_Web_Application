import { ApiError } from "@/server/http/errors";
import { prisma } from "@/server/db/prisma";

export type AdminTestimonial = {
  id: string;
  kind: string;
  name: string;
  body: string;
  location: string | null;
  scenario: string | null;
  reason: string | null;
  headline: string | null;
  pull_quote: string | null;
  youtube_id: string | null;
  video_src: string | null;
  poster_url: string | null;
  thumbnail_url: string | null;
  rating: number | null;
  is_featured: boolean | null;
  sort_order: number | null;
  status: string | null;
  market_slug: string | null;
  created_at: string | null;
  updated_at: string | null;
  testimonial_points: Array<{ point: string; sort_order: number | null }>;
  points: string[];
};

export type TestimonialInput = {
  kind: "video" | "written";
  name: string;
  body: string;
  location: string | null;
  scenario: string | null;
  reason: string | null;
  headline: string | null;
  pullQuote: string | null;
  youtubeId: string | null;
  videoSrc: string | null;
  posterUrl: string | null;
  thumbnailUrl: string | null;
  rating: number;
  isFeatured: boolean;
  sortOrder: number;
  status: "draft" | "published" | "archived";
  marketSlug: string | null;
  points: string[];
};

export type SectionAssignment = {
  id: string;
  section: string;
  testimonial_id: string;
  sort_order: number;
  created_at: string;
};

const TESTIMONIAL_SECTIONS = new Set(["spotlight", "featured", "editorial"]);

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw ApiError.badRequest("Invalid testimonial field");
  return value;
}

export function parseTestimonialInput(body: unknown): TestimonialInput {
  if (!body || typeof body !== "object") throw ApiError.badRequest("Invalid testimonial");
  const input = body as Record<string, unknown>;
  if (
    (input.kind !== "video" && input.kind !== "written") ||
    typeof input.name !== "string" ||
    typeof input.body !== "string" ||
    (input.status !== "draft" && input.status !== "published" && input.status !== "archived") ||
    typeof input.rating !== "number" ||
    !Number.isInteger(input.rating) ||
    typeof input.is_featured !== "boolean" ||
    typeof input.sort_order !== "number" ||
    !Number.isInteger(input.sort_order) ||
    !Array.isArray(input.points) ||
    !input.points.every((point) => typeof point === "string")
  ) {
    throw ApiError.badRequest("Invalid testimonial");
  }

  return {
    kind: input.kind,
    name: input.name,
    body: input.body,
    location: nullableString(input.location),
    scenario: nullableString(input.scenario),
    reason: nullableString(input.reason),
    headline: nullableString(input.headline),
    pullQuote: nullableString(input.pull_quote),
    youtubeId: nullableString(input.youtube_id),
    videoSrc: nullableString(input.video_src),
    posterUrl: nullableString(input.poster_url),
    thumbnailUrl: nullableString(input.thumbnail_url),
    rating: input.rating,
    isFeatured: input.is_featured,
    sortOrder: input.sort_order,
    status: input.status,
    marketSlug: nullableString(input.market_slug),
    points: input.points.map((point) => point.trim()).filter(Boolean),
  };
}

function mapTestimonial(row: {
  id: string;
  kind: string;
  name: string;
  body: string;
  location: string | null;
  scenario: string | null;
  reason: string | null;
  headline: string | null;
  pullQuote: string | null;
  youtubeId: string | null;
  videoSrc: string | null;
  posterUrl: string | null;
  thumbnailUrl: string | null;
  rating: number | null;
  isFeatured: boolean | null;
  sortOrder: number | null;
  status: string | null;
  marketSlug: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  points: Array<{ point: string; sortOrder: number | null }>;
}): AdminTestimonial {
  const testimonial_points = row.points.map((point) => ({ point: point.point, sort_order: point.sortOrder }));
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    body: row.body,
    location: row.location,
    scenario: row.scenario,
    reason: row.reason,
    headline: row.headline,
    pull_quote: row.pullQuote,
    youtube_id: row.youtubeId,
    video_src: row.videoSrc,
    poster_url: row.posterUrl,
    thumbnail_url: row.thumbnailUrl,
    rating: row.rating,
    is_featured: row.isFeatured,
    sort_order: row.sortOrder,
    status: row.status,
    market_slug: row.marketSlug,
    created_at: row.createdAt?.toISOString() ?? null,
    updated_at: row.updatedAt?.toISOString() ?? null,
    testimonial_points,
    points: testimonial_points.map((point) => point.point),
  };
}

function testimonialData(input: TestimonialInput) {
  return {
    kind: input.kind,
    name: input.name,
    body: input.body,
    location: input.location,
    scenario: input.scenario,
    reason: input.reason,
    headline: input.headline,
    pullQuote: input.pullQuote,
    youtubeId: input.youtubeId,
    videoSrc: input.videoSrc,
    posterUrl: input.posterUrl,
    thumbnailUrl: input.thumbnailUrl,
    rating: input.rating,
    isFeatured: input.isFeatured,
    sortOrder: input.sortOrder,
    status: input.status,
    marketSlug: input.marketSlug,
  };
}

const testimonialInclude = {
  points: { orderBy: { sortOrder: "asc" as const } },
};

export async function getAdminTestimonials(): Promise<AdminTestimonial[]> {
  const rows = await prisma.testimonial.findMany({
    include: testimonialInclude,
    orderBy: { sortOrder: "asc" },
  });
  return rows.map(mapTestimonial);
}

export async function createTestimonial(input: TestimonialInput): Promise<AdminTestimonial> {
  const row = await prisma.testimonial.create({
    data: {
      ...testimonialData(input),
      points: { create: input.points.map((point, sortOrder) => ({ point, sortOrder })) },
    },
    include: testimonialInclude,
  });
  return mapTestimonial(row);
}

export async function updateTestimonial(id: string, input: TestimonialInput): Promise<AdminTestimonial> {
  const existing = await prisma.testimonial.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw ApiError.notFound("Testimonial not found");

  const row = await prisma.testimonial.update({
    where: { id },
    data: {
      ...testimonialData(input),
      updatedAt: new Date(),
      points: {
        deleteMany: {},
        create: input.points.map((point, sortOrder) => ({ point, sortOrder })),
      },
    },
    include: testimonialInclude,
  });
  return mapTestimonial(row);
}

export async function deleteTestimonial(id: string): Promise<void> {
  const existing = await prisma.testimonial.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw ApiError.notFound("Testimonial not found");
  await prisma.testimonial.delete({ where: { id } });
}

export async function setTestimonialFeatured(id: string, isFeatured: boolean): Promise<AdminTestimonial> {
  const existing = await prisma.testimonial.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw ApiError.notFound("Testimonial not found");
  const row = await prisma.testimonial.update({
    where: { id },
    data: { isFeatured, updatedAt: new Date() },
    include: testimonialInclude,
  });
  return mapTestimonial(row);
}

export async function getSectionAssignments(): Promise<SectionAssignment[]> {
  const rows = await prisma.testimonialSectionAssignment.findMany({
    orderBy: [{ section: "asc" }, { sortOrder: "asc" }],
  });
  return rows.map((row) => ({
    id: row.id,
    section: row.section,
    testimonial_id: row.testimonialId,
    sort_order: row.sortOrder,
    created_at: row.createdAt.toISOString(),
  }));
}

export async function replaceSectionAssignments(section: string, testimonialIds: string[]): Promise<SectionAssignment[]> {
  if (!TESTIMONIAL_SECTIONS.has(section)) {
    throw ApiError.badRequest("Invalid testimonial section");
  }
  if (new Set(testimonialIds).size !== testimonialIds.length) {
    throw ApiError.badRequest("Duplicate testimonials are not allowed");
  }

  return prisma.$transaction(async (tx) => {
    if (testimonialIds.length > 0) {
      const testimonials = await tx.testimonial.findMany({
        where: { id: { in: testimonialIds }, status: "published" },
        select: { id: true },
      });
      if (testimonials.length !== testimonialIds.length) {
        throw ApiError.badRequest("Only published testimonials can be assigned");
      }
    }

    await tx.testimonialSectionAssignment.deleteMany({ where: { section } });
    if (testimonialIds.length > 0) {
      await tx.testimonialSectionAssignment.createMany({
        data: testimonialIds.map((testimonialId, sortOrder) => ({ section, testimonialId, sortOrder })),
      });
    }

    const rows = await tx.testimonialSectionAssignment.findMany({
      where: { section },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      section: row.section,
      testimonial_id: row.testimonialId,
      sort_order: row.sortOrder,
      created_at: row.createdAt.toISOString(),
    }));
  });
}
