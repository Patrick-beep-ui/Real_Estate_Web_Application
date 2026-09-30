import { withAdmin } from "@/server/auth/with-admin";
import { ApiError } from "@/server/http/errors";
import { okResponse } from "@/server/http/responses";
import {
  getAdminTrackingSubmissions,
  TRACKING_TEST_FILTERS,
  TRACKING_TRAFFIC_FILTERS,
  type TrackingTestFilter,
  type TrackingTrafficFilter,
} from "@/server/modules/tracking/tracking.repository";

function parseTimestamp(value: string | null, name: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw ApiError.badRequest(`${name} must be a valid ISO timestamp`);
  }
  return date;
}

function parseFilter<T extends string>(
  value: string | null,
  allowed: readonly T[],
  name: string,
): T {
  const filter = value ?? "all";
  if (!allowed.includes(filter as T)) {
    throw ApiError.badRequest(`Invalid ${name} filter`);
  }
  return filter as T;
}

export const GET = withAdmin(async (request) => {
  const from = parseTimestamp(request.nextUrl.searchParams.get("from"), "from");
  const to = parseTimestamp(request.nextUrl.searchParams.get("to"), "to");
  if (from && to && to < from) {
    throw ApiError.badRequest("to must not be earlier than from");
  }

  const traffic = parseFilter<TrackingTrafficFilter>(
    request.nextUrl.searchParams.get("traffic"),
    TRACKING_TRAFFIC_FILTERS,
    "traffic",
  );
  const test = parseFilter<TrackingTestFilter>(
    request.nextUrl.searchParams.get("test"),
    TRACKING_TEST_FILTERS,
    "test",
  );

  return okResponse(await getAdminTrackingSubmissions({ from, to, traffic, test }));
});
