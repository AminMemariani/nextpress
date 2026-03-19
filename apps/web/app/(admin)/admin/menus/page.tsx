import { requirePermission } from "@/lib/auth/guards";
import { getServerCaller } from "@/lib/trpc/server";
import { PageHeader } from "@nextpress/ui";
import { MenuBuilder } from "@/components/admin/menus/menu-builder";

export default async function MenusPage() {
  await requirePermission("manage_menus");

  const caller = await getServerCaller();
  const [locations, menus] = await Promise.all([
    caller.menu.locations(),
    caller.menu.list(),
  ]);

  return (
    <div>
      <PageHeader title="Menus" description="Build and manage navigation menus" />
      <MenuBuilder locations={locations} initialMenus={menus} />
    </div>
  );
}
