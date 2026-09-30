import { withAdmin } from "@/server/auth/with-admin";
import { okResponse } from "@/server/http/responses";
import { getAdminLeadErrors } from "@/server/modules/lead-errors/lead-errors.repository";

export const GET = withAdmin(async () => okResponse({ items: await getAdminLeadErrors() }));
