import { withAdmin } from "@/server/auth/with-admin";
import { ApiError } from "@/server/http/errors";
import { okResponse } from "@/server/http/responses";
import { setTestimonialFeatured } from "@/server/modules/testimonials/testimonials.repository";

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withAdmin(async (request, _admin, routeContext) => {
  const { id } = await (routeContext as RouteContext).params;
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || typeof (body as { isFeatured?: unknown }).isFeatured !== "boolean") {
    throw ApiError.badRequest("isFeatured must be a boolean");
  }

  return okResponse({ item: await setTestimonialFeatured(id, (body as { isFeatured: boolean }).isFeatured) });
});
