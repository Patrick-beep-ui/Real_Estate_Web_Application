import { withAdmin } from "@/server/auth/with-admin";
import { okResponse } from "@/server/http/responses";
import { parseBlogUpdateInput, updateAdminBlog } from "@/server/modules/blogs/blogs.repository";

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withAdmin(async (request, _admin, routeContext) => {
  const { id } = await (routeContext as RouteContext).params;
  const body: unknown = await request.json().catch(() => null);
  return okResponse({ item: await updateAdminBlog(id, parseBlogUpdateInput(body)) });
});
