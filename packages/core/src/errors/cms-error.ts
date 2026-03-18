/**
 * Base error class for all CMS errors.
 * Carries an error code (for i18n/client mapping) and HTTP status code.
 */
export class CmsError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "CmsError";
  }
}

export class AuthenticationError extends CmsError {
  constructor(message = "Not authenticated") {
    super(message, "UNAUTHENTICATED", 401);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends CmsError {
  constructor(
    message = "Insufficient permissions",
    details?: Record<string, unknown>,
  ) {
    super(message, "FORBIDDEN", 403, details);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends CmsError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} not found: ${id}` : `${resource} not found`,
      "NOT_FOUND",
      404,
    );
    this.name = "NotFoundError";
  }
}

export class ValidationError extends CmsError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}
