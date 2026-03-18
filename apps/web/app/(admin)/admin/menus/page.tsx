import { requirePermission } from "@/lib/auth/guards";
import { PageHeader } from "@nextpress/ui";

export default async function MenusPage() {
  await requirePermission("manage_menus");

  return (
    <div>
      <PageHeader title="Menus" description="Build and manage navigation menus" />
      <p className="text-gray-500">Drag-drop menu builder with items from content, taxonomies, and custom links. Assign menus to theme locations.</p>
    </div>
  );
}
