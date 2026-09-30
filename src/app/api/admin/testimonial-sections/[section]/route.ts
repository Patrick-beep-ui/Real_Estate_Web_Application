import { withAdmin } from "@/server/auth/with-admin";
import { ApiError } from "@/server/http/errors";
import { okResponse } from "@/server/http/responses";
import { replaceSectionAssignments } from "@/server/modules/testimonials/testimonials.repository";

type RouteContext = { params: Promise<{ section: string }> };

export const PUT = withAdmin(async (request, _admin, routeContext) => {
  const { section } = await (routeContext as RouteContext).params;
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !Array.isArray((body as { testimonialIds?: unknown }).testimonialIds)) {
    throw ApiError.badRequest("testimonialIds must be an array");
  }

  const testimonialIds = (body as { testimonialIds: unknown[] }).testimonialIds;
  if (!testimonialIds.every((id) => typeof id === "string")) {
    throw ApiError.badRequest("testimonialIds must contain strings");
  }

  return okResponse({ items: await replaceSectionAssignments(section, testimonialIds) });
});
