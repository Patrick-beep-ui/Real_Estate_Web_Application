import { withAdmin } from "@/server/auth/with-admin";
import { okResponse } from "@/server/http/responses";
import { getContentPerformanceSnapshots } from "@/server/modules/content-studio/content-studio.repository";

export const GET = withAdmin(async () => okResponse({ items: await getContentPerformanceSnapshots() }));
