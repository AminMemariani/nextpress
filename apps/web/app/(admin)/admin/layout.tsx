import { redirect } from "next/navigation";

import { getAuthContext } from "@/lib/auth/session";
import { canAccessAdmin } from "@nextpress/core/auth/permissions";
import { getPermissionSummary } from "@/lib/permissions/check";

/**
 * Admin layout — wraps all /admin/* pages.
 *
 * Security: This layout is the first server-side gate for the admin panel.
 * Middleware already redirected unauthenticated users, but this layout
 * additionally verifies:
 *   1. The user has a valid AuthContext (session + site role)
 *   2. The user has at least "read" permission (canAccessAdmin)
 *
 * The permission summary is fetched once here and passed to the sidebar
 * so it can conditionally render nav items without additional DB queries.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/login");
  }

  const accessResult = canAccessAdmin(auth);
  if (!accessResult.granted) {
    redirect("/login?error=unauthorized");
  }

  const permissions = await getPermissionSummary();

  return (
    <div className="flex h-screen">
      {/* Sidebar — uses permissions to show/hide nav items */}
      <aside className="w-64 border-r bg-gray-50 p-4">
        <nav className="space-y-1">
          <SidebarLink href="/admin" label="Dashboard" />
          <SidebarLink href="/admin/posts" label="Posts" />

          {permissions.canUploadMedia && (
            <SidebarLink href="/admin/media" label="Media" />
          )}

          {permissions.canModerateComments && (
            <SidebarLink href="/admin/comments" label="Comments" />
          )}

          {permissions.canManageUsers && (
            <SidebarLink href="/admin/users" label="Users" />
          )}

          {permissions.canManageAppearance && (
            <>
              <SidebarLink href="/admin/appearance/themes" label="Themes" />
              <SidebarLink href="/admin/menus" label="Menus" />
            </>
          )}

          {permissions.canManagePlugins && (
            <SidebarLink href="/admin/plugins" label="Plugins" />
          )}

          {permissions.canManageSettings && (
            <SidebarLink href="/admin/settings" label="Settings" />
          )}

          <SidebarLink href="/admin/profile" label="Profile" />
        </nav>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}

function SidebarLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="block rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
    >
      {label}
    </a>
  );
}
