import type { AuthContext, SessionUser } from "@nextpress/core/auth/auth-types";

/**
 * tRPC context created for every request.
 *
 * `session` is the raw Auth.js session user (always available after auth middleware).
 * `auth` is the full authorization context with site-scoped role and permissions.
 * It is null for public procedures and populated by the `authed` middleware.
 */
export interface TrpcContext {
  session: SessionUser | null;
  auth: AuthContext | null;
}

/**
 * Authenticated tRPC context — guaranteed to have session and auth.
 * Used by procedures behind the `authed` middleware.
 */
export interface AuthedTrpcContext extends TrpcContext {
  session: SessionUser;
  auth: AuthContext;
}
