import { withAdmin } from "@/server/auth/with-admin";
import { ApiError } from "@/server/http/errors";
import { okResponse } from "@/server/http/responses";
import { retryLeadError } from "@/server/modules/lead-errors/lead-error-retry.service";

export const POST = withAdmin(async (request, _admin, routeContext) => {
  const { id } = await (routeContext as { params: Promise<{ id: string }> }).params;
  const body: unknown = await request.json().catch(() => null);
  const result = await retryLeadError(id, body);
  if (!result.dbSuccess && !result.ghlSuccess) {
    throw ApiError.internalServerError(result.error?.message || result.ghlError?.message || "Retry failed");
  }
  return okResponse(result);
});
