import { redirect } from "next/navigation";

import { getAuthContext } from "@/lib/auth/session";
import { canAccessAdmin } from "@nextpress/core/auth/permissions";
import { getPermissionSummary } from "@/lib/permissions/check";
import { AdminProviders } from "@/components/admin/shell/admin-providers";
import { Sidebar } from "@/components/admin/shell/sidebar";
import { Topbar } from "@/components/admin/shell/topbar";

/**
 * Admin Layout — server component shell.
 *
 * 1. Verifies auth + admin access (redirects if denied)
 * 2. Builds permission-gated navigation items
 * 3. Wraps children in client provider boundary (AdminProviders)
 * 4. Renders sidebar (client) + topbar (client) + content area
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const accessResult = canAccessAdmin(auth);
  if (!accessResult.granted) redirect("/login?error=unauthorized");

  const perms = await getPermissionSummary();

  // Build nav items based on permissions
  const navItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/posts", label: "Posts" },
  ];

  if (perms.canUploadMedia) {
    navItems.push({ href: "/admin/media", label: "Media" });
  }
  if (perms.canModerateComments) {
    navItems.push({ href: "/admin/comments", label: "Comments" });
  }
  if (perms.canManageUsers) {
    navItems.push({ href: "/admin/users", label: "Users" });
  }
  if (perms.canManageAppearance) {
    navItems.push(
      { href: "/admin/menus", label: "Menus" },
      { href: "/admin/appearance/themes", label: "Themes" },
    );
  }
  if (perms.canManagePlugins) {
    navItems.push({ href: "/admin/plugins", label: "Plugins" });
  }
  if (perms.canManageSettings) {
    navItems.push(
      { href: "/admin/content-types", label: "Content Types" },
      { href: "/admin/taxonomies", label: "Taxonomies" },
      { href: "/admin/settings", label: "Settings" },
    );
  }
  navItems.push({ href: "/admin/profile", label: "Profile" });

  return (
    <AdminProviders>
      <div className="flex h-screen bg-gray-50">
        <Sidebar items={navItems} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </AdminProviders>
  );
}
