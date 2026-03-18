import "server-only";

import { redirect } from "next/navigation";

import { getAuthContext, requireAuthContext } from "./session";
import type { PermissionSlug } from "@nextpress/core/auth/auth-types";
import {
  can,
  canAccessAdmin,
} from "@nextpress/core/auth/permissions";

// ============================================================================
// Server Component Guards
// ============================================================================
// These are meant to be called at the TOP of page.tsx server components.
// They redirect or throw — never return a "denied" state for the component
// to handle. This is the secure pattern: deny first, render second.
//
// For conditional UI ("show edit button if user can edit"), use the
// permission check helpers in lib/permissions/check.ts instead.
// ============================================================================

/**
 * Guard: require authentication. Redirects to login if not authenticated.
 * Use in admin layouts and pages.
 *
 * @example
 *   export default async function AdminPage() {
 *     const auth = await requireAdmin();
 *     // ... render admin content
 *   }
 */
export async function requireAdmin() {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/login");
  }

  const result = canAccessAdmin(auth);
  if (!result.granted) {
    redirect("/login?error=unauthorized");
  }

  return auth;
}

/**
 * Guard: require a specific permission.
 * Redirects to admin dashboard with error if permission denied.
 *
 * @example
 *   export default async function UsersPage() {
 *     const auth = await requirePermission("list_users");
 *     // ... render user list
 *   }
 */
export async function requirePermission(permission: PermissionSlug) {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/login");
  }

  const result = can(auth, permission);
  if (!result.granted) {
    redirect("/admin?error=forbidden");
  }

  return auth;
}

/**
 * Guard: require one of several permissions.
 * Passes if the user has ANY of the listed permissions.
 *
 * @example
 *   export default async function AppearancePage() {
 *     const auth = await requireAnyPermission(["switch_themes", "customize_theme"]);
 *     // ... render appearance settings
 *   }
 */
export async function requireAnyPermission(
  permissions: PermissionSlug[],
) {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/login");
  }

  const hasAny = permissions.some((p) => can(auth, p).granted);
  if (!hasAny) {
    redirect("/admin?error=forbidden");
  }

  return auth;
}

/**
 * Guard: require super_admin role.
 * For multi-tenant management pages only.
 *
 * @example
 *   export default async function SitesPage() {
 *     const auth = await requireSuperAdmin();
 *     // ... render site management
 *   }
 */
export async function requireSuperAdmin() {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/login");
  }

  if (auth.role !== "super_admin") {
    redirect("/admin?error=forbidden");
  }

  return auth;
}
