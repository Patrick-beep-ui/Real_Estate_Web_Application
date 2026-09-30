import { withAdmin } from "@/server/auth/with-admin";
import { okResponse } from "@/server/http/responses";
import { clearResolvedLeadErrors } from "@/server/modules/lead-errors/lead-errors.repository";

export const DELETE = withAdmin(async () => okResponse({ count: await clearResolvedLeadErrors() }));
