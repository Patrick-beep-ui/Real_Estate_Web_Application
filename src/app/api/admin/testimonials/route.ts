import { withAdmin } from "@/server/auth/with-admin";
import { createdResponse, okResponse } from "@/server/http/responses";
import { createTestimonial, getAdminTestimonials, parseTestimonialInput } from "@/server/modules/testimonials/testimonials.repository";

export const GET = withAdmin(async () => okResponse({ items: await getAdminTestimonials() }));

export const POST = withAdmin(async (request) => {
  const body: unknown = await request.json().catch(() => null);
  return createdResponse({ item: await createTestimonial(parseTestimonialInput(body)) });
});
