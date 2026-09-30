import { withAdmin } from "@/server/auth/with-admin";
import { noContentResponse, okResponse } from "@/server/http/responses";
import { deleteTestimonial, parseTestimonialInput, updateTestimonial } from "@/server/modules/testimonials/testimonials.repository";

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withAdmin(async (request, _admin, routeContext) => {
  const { id } = await (routeContext as RouteContext).params;
  const body: unknown = await request.json().catch(() => null);
  return okResponse({ item: await updateTestimonial(id, parseTestimonialInput(body)) });
});

export const DELETE = withAdmin(async (_request, _admin, routeContext) => {
  const { id } = await (routeContext as RouteContext).params;
  await deleteTestimonial(id);
  return noContentResponse();
});
