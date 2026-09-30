import { withAdmin } from "@/server/auth/with-admin";
import { ApiError } from "@/server/http/errors";
import { okResponse } from "@/server/http/responses";
import { getEmailTemplateVersion } from "@/server/modules/content-studio/content-studio.repository";

export const GET = withAdmin(async (request, _admin, routeContext) => {
  const { params } = routeContext as { params: Promise<{ marketSlug: string; situationSlug: string }> };
  const { marketSlug, situationSlug } = await params;
  const version = Number(new URL(request.url).searchParams.get("version"));
  if (!Number.isInteger(version) || version < 1) {
    throw ApiError.badRequest("A valid version is required");
  }

  return okResponse({ items: await getEmailTemplateVersion(marketSlug, situationSlug, version) });
});
