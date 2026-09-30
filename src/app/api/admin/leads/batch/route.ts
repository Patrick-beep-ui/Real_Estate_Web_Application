import { withAdmin } from "@/server/auth/with-admin";
import { ApiError } from "@/server/http/errors";
import { okResponse } from "@/server/http/responses";
import { batchUpdatePipelineStages } from "@/server/modules/leads/leads.repository";

export const POST = withAdmin(async (request) => {
  const body: unknown = await request.json().catch(() => null);
  const changes = (body as { changes?: unknown } | null)?.changes ?? null;
  if (changes === null || typeof changes !== "object" || Array.isArray(changes)) {
    throw ApiError.badRequest("changes must be an object of lead id to pipeline stage");
  }
  const result = await batchUpdatePipelineStages(changes as Record<string, string>);
  return okResponse(result);
});