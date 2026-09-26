import { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/require-admin";
import { getOverviewStats } from "@/server/modules/overview/overview.repository";
import { okResponse, handleError } from "@/server/http/responses";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    return okResponse(await getOverviewStats());
  } catch (err) {
    return handleError(err);
  }
}