import { withAdmin } from "@/server/auth/with-admin";
import { okResponse } from "@/server/http/responses";
import { getAdminBlogBySlug } from "@/server/modules/blogs/blogs.repository";

type RouteContext = { params: Promise<{ slug: string }> };

export const GET = withAdmin(async (_request, _admin, routeContext) => {
  const { slug } = await (routeContext as RouteContext).params;
  return okResponse({ item: await getAdminBlogBySlug(slug) });
});
