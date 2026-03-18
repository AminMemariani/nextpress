import { requireAdmin } from "@/lib/auth/guards";
import { PageHeader } from "@nextpress/ui";
import { prisma } from "@nextpress/db";

export default async function ProfilePage() {
  const auth = await requireAdmin();
  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { id: true, email: true, name: true, displayName: true, bio: true, image: true },
  });

  return (
    <div>
      <PageHeader title="Profile" description="Manage your account settings" />
      <div className="bg-white rounded-lg border p-6 max-w-2xl space-y-4">
        <div><label className="text-sm font-medium">Email</label><p className="text-gray-600">{user?.email}</p></div>
        <div><label className="text-sm font-medium">Display Name</label><p className="text-gray-600">{user?.displayName ?? "—"}</p></div>
        <div><label className="text-sm font-medium">Role</label><p className="text-gray-600">{auth.role}</p></div>
        <p className="text-sm text-gray-400">Profile editing form will be implemented here.</p>
      </div>
    </div>
  );
}
