import { withAdmin } from "@/server/auth/with-admin";
import { noContentResponse } from "@/server/http/responses";
import { deleteLeadError } from "@/server/modules/lead-errors/lead-errors.repository";

export const DELETE = withAdmin(async (_request, _admin, routeContext) => {
  const { id } = await (routeContext as { params: Promise<{ id: string }> }).params;
  await deleteLeadError(id);
  return noContentResponse();
});
