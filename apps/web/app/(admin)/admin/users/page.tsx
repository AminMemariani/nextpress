import { requirePermission } from "@/lib/auth/guards";

/**
 * Users page — requires "list_users" permission.
 *
 * Contributors and subscribers will be redirected away.
 * Only editors, admins, and super_admins can see this page.
 */
export default async function UsersPage() {
  const auth = await requirePermission("list_users");

  return (
    <div>
      <h1 className="text-2xl font-bold">Users</h1>
      <p className="text-sm text-gray-500">
        Managing users for site: {auth.siteId}
      </p>
      {/* UserListTable component would go here */}
    </div>
  );
}
