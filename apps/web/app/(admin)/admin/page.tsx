import { requireAdmin } from "@/lib/auth/guards";

/**
 * Admin Dashboard — requires authentication + "read" permission.
 * The simplest guard: any authenticated user with admin access sees this.
 */
export default async function DashboardPage() {
  const auth = await requireAdmin();

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Welcome, {auth.user.displayName ?? auth.user.name ?? auth.user.email}
      </p>
      <p className="text-sm text-gray-400">
        Role: {auth.role} | Site: {auth.siteId}
      </p>
    </div>
  );
}
