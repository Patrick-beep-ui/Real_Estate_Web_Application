import { withAdmin } from "@/server/auth/with-admin";
import { okResponse } from "@/server/http/responses";
import { getOverviewStats } from "@/server/modules/overview/overview.repository";

export const GET = withAdmin(async () => okResponse(await getOverviewStats()));