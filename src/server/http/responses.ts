import { NextResponse } from "next/server";
import { ApiError } from "./errors";

export type ErrorBody = {
  error: string;
  error_code: string;
  details?: unknown;
};

function errorResponse(status: number, body: ErrorBody, init?: ResponseInit): NextResponse {
  return NextResponse.json(body, { status, ...init });
}

export function okResponse<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, { status: 200, ...init });
}

export function createdResponse<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, { status: 201, ...init });
}

export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function successResponse<T extends Record<string, unknown>>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, ...data }, { status });
}

export function badRequestResponse(message = "Bad request", details?: unknown): NextResponse {
  return errorResponse(400, { error: message, error_code: "BAD_REQUEST", details });
}

export function unauthorizedResponse(message = "Unauthorized"): NextResponse {
  return errorResponse(401, { error: message, error_code: "UNAUTHORIZED" });
}

export function forbiddenResponse(message = "Forbidden"): NextResponse {
  return errorResponse(403, { error: message, error_code: "FORBIDDEN" });
}

export function notFoundResponse(message = "Not found"): NextResponse {
  return errorResponse(404, { error: message, error_code: "NOT_FOUND" });
}

export function conflictResponse(message = "Conflict", details?: unknown): NextResponse {
  return errorResponse(409, { error: message, error_code: "CONFLICT", details });
}

export function unprocessableResponse(message = "Unprocessable entity", details?: unknown): NextResponse {
  return errorResponse(422, { error: message, error_code: "UNPROCESSABLE_ENTITY", details });
}

export function rateLimitedResponse(retryAfterSeconds?: number): NextResponse {
  const init =
    retryAfterSeconds !== undefined
      ? { headers: { "Retry-After": String(retryAfterSeconds) } }
      : undefined;
  return errorResponse(429, { error: "Too many requests", error_code: "RATE_LIMITED" }, init);
}

export function serverErrorResponse(message = "Internal server error"): NextResponse {
  return errorResponse(500, { error: message, error_code: "INTERNAL_SERVER_ERROR" });
}

export function fromApiError(err: ApiError): NextResponse {
  const body: ErrorBody = { error: err.message, error_code: err.code };
  if (err.details !== undefined) {
    body.details = err.details;
  }
  const init =
    err.retryAfterSeconds !== undefined
      ? { headers: { "Retry-After": String(err.retryAfterSeconds) } }
      : undefined;
  return errorResponse(err.status, body, init);
}

export function handleError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return fromApiError(err);
  }
  console.error("Unhandled API error:", err);
  return serverErrorResponse();
}