import { withAdmin } from "@/server/auth/with-admin";
import { okResponse } from "@/server/http/responses";
import { getAnalyticsStats } from "@/server/modules/analytics/analytics.repository";

export const GET = withAdmin(async () => okResponse(await getAnalyticsStats()));