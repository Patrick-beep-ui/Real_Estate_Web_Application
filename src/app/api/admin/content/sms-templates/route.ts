import { withAdmin } from "@/server/auth/with-admin";
import { ApiError } from "@/server/http/errors";
import { okResponse } from "@/server/http/responses";
import { getSmsTemplateStatuses, setSmsTemplateStatus, type ContentStatus } from "@/server/modules/content-studio/content-studio.repository";

export const GET = withAdmin(async () => okResponse({ items: await getSmsTemplateStatuses() }));

export const PATCH = withAdmin(async (request) => {
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    throw ApiError.badRequest("Invalid status update");
  }

  const { marketSlug, situationSlug, version, status } = body as Record<string, unknown>;
  if (
    typeof marketSlug !== "string" ||
    typeof situationSlug !== "string" ||
    typeof version !== "number" ||
    (status !== "draft" && status !== "published")
  ) {
    throw ApiError.badRequest("Invalid status update");
  }

  const count = await setSmsTemplateStatus({ marketSlug, situationSlug, version, status: status as ContentStatus });
  if (!count) {
    throw ApiError.notFound("SMS template version not found");
  }

  return okResponse({ status, updated: count });
});
