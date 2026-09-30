import type { NextRequest, NextResponse } from "next/server";
import { requireAdmin, type AdminContext } from "@/server/auth/require-admin";
import { handleError } from "@/server/http/responses";

export type AdminHandler = (
  req: NextRequest,
  admin: AdminContext,
  routeContext: unknown,
) => NextResponse | Promise<NextResponse>;

export function withAdmin(handler: AdminHandler) {
  return async (req: NextRequest, routeContext: unknown): Promise<NextResponse> => {
    try {
      const admin = await requireAdmin(req);
      return await handler(req, admin, routeContext);
    } catch (err) {
      return handleError(err);
    }
  };
}