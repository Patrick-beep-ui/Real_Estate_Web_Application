import { withAdmin } from "@/server/auth/with-admin";
import { ApiError } from "@/server/http/errors";
import { okResponse } from "@/server/http/responses";
import { deleteLead, parseLeadPatch, updateLead } from "@/server/modules/leads/leads.repository";

export const PATCH = withAdmin(async (_request, _admin, routeContext) => {
  const { id } = await (routeContext as { params: Promise<{ id: string }> }).params;
  if (!id) {
    throw ApiError.badRequest("Lead id is required");
  }
  const body: unknown = await _request.json().catch(() => null);
  const updated = await updateLead(id, parseLeadPatch(body));
  return okResponse(updated);
});

export const DELETE = withAdmin(async (_request, _admin, routeContext) => {
  const { id } = await (routeContext as { params: Promise<{ id: string }> }).params;
  if (!id) {
    throw ApiError.badRequest("Lead id is required");
  }
  await deleteLead(id);
  return okResponse({ ok: true });
});