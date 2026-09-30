import { withAdmin } from "@/server/auth/with-admin";
import { okResponse } from "@/server/http/responses";
import { getSectionAssignments } from "@/server/modules/testimonials/testimonials.repository";

export const GET = withAdmin(async () => okResponse({ items: await getSectionAssignments() }));
