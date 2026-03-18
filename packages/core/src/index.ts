// ============================================================================
// @nextpress/core — Public API
// ============================================================================

// ── Auth ──
export type {
  PermissionMap,
  PermissionSlug,
  RoleSlug,
  SessionUser,
  AuthContext,
  ResourceContext,
  PermissionResult,
} from "./auth/auth-types";

export {
  can,
  assertCan,
  assertAuthenticated,
  canCreateContent,
  canEditContent,
  canDeleteContent,
  canPublishContent,
  canUploadMedia,
  canModerateComments,
  canManageUsers,
  canManageSettings,
  canManagePlugins,
  canManageAppearance,
  canAccessAdmin,
} from "./auth/permissions";

export {
  ROLE_DEFINITIONS,
  ROLE_MAP,
  SUPER_ADMIN_ROLE,
} from "./auth/roles";
export type { RoleDefinition } from "./auth/roles";

export {
  PERMISSION_DEFINITIONS,
  BCRYPT_ROUNDS,
  SESSION_CONFIG,
  PUBLIC_ROUTES,
  PROTECTED_ROUTE_PREFIXES,
} from "./auth/auth-config";

// ── Errors ──
export {
  CmsError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "./errors/cms-error";

export { ErrorCodes } from "./errors/error-codes";
export type { ErrorCode } from "./errors/error-codes";
