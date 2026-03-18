"use client";

import { useSession } from "next-auth/react";

/**
 * Client-side hook for basic auth state.
 *
 * IMPORTANT: This only tells you if the user is logged in.
 * It does NOT check permissions — those require the AuthContext which is
 * resolved server-side (it needs a DB query to join UserSite + Role + Permissions).
 *
 * For permission-based UI, either:
 *   1. Use server components (preferred) — they have full AuthContext
 *   2. Pass permissions as props from a server component parent
 *   3. Use a tRPC query to fetch the permission summary
 *
 * Never trust client-side permission checks for security. They control UI only.
 * The server always re-validates on mutation.
 */
export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user ?? null,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
  };
}

/**
 * Client-side permission check using permissions passed from server.
 * The server component fetches the permission summary and passes it as props.
 *
 * @example
 *   // Server component:
 *   const perms = await getPermissionSummary();
 *   return <ClientComponent permissions={perms} />;
 *
 *   // Client component:
 *   function ClientComponent({ permissions }) {
 *     const { hasPermission } = useClientPermissions(permissions);
 *     return hasPermission("canCreateContent") ? <CreateButton /> : null;
 *   }
 */
export function useClientPermissions(
  permissions: Record<string, boolean>,
) {
  return {
    hasPermission: (key: string) => permissions[key] ?? false,
  };
}
