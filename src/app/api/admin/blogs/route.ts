import { withAdmin } from "@/server/auth/with-admin";
import { createdResponse, okResponse } from "@/server/http/responses";
import { createAdminBlog, getAdminBlogs, parseBlogCreateInput } from "@/server/modules/blogs/blogs.repository";

export const GET = withAdmin(async () => okResponse({ items: await getAdminBlogs() }));

export const POST = withAdmin(async (request) => {
  const body: unknown = await request.json().catch(() => null);
  return createdResponse({ item: await createAdminBlog(parseBlogCreateInput(body)) });
});
