export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly retryAfterSeconds?: number;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  static badRequest(message = "Invalid request", details?: unknown): ApiError {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }

  static unauthorized(message = "Unauthorized", details?: unknown): ApiError {
    return new ApiError(401, "UNAUTHORIZED", message, details);
  }

  static forbidden(message = "Forbidden", details?: unknown): ApiError {
    return new ApiError(403, "FORBIDDEN", message, details);
  }

  static notFound(message = "Not found", details?: unknown): ApiError {
    return new ApiError(404, "NOT_FOUND", message, details);
  }

  static conflict(message = "Conflict", details?: unknown): ApiError {
    return new ApiError(409, "CONFLICT", message, details);
  }

  static unprocessableEntity(message = "Unprocessable entity", details?: unknown): ApiError {
    return new ApiError(422, "UNPROCESSABLE_ENTITY", message, details);
  }

  static rateLimited(retryAfterSeconds?: number, message = "Rate limited", details?: unknown): ApiError {
    return new ApiError(429, "RATE_LIMITED", message, details, retryAfterSeconds);
  }

  static internalServerError(message = "Internal server error", details?: unknown): ApiError {
    return new ApiError(500, "INTERNAL_SERVER_ERROR", message, details);
  }
}