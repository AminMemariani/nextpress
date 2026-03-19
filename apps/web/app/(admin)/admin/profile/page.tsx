import { requireAdmin } from "@/lib/auth/guards";
import { getServerCaller } from "@/lib/trpc/server";
import { PageHeader } from "@nextpress/ui";

export default async function ProfilePage() {
  const auth = await requireAdmin();
  const caller = await getServerCaller();
  const user = await caller.user.me();

  return (
    <div>
      <PageHeader title="Profile" description="Manage your account settings" />
      <div className="bg-white rounded-lg border p-6 max-w-2xl space-y-4">
        <div><label className="text-sm font-medium">Email</label><p className="text-gray-600">{user.email}</p></div>
        <div><label className="text-sm font-medium">Display Name</label><p className="text-gray-600">{user.displayName ?? "—"}</p></div>
        <div><label className="text-sm font-medium">Role</label><p className="text-gray-600">{user.role}</p></div>
      </div>
    </div>
  );
}
