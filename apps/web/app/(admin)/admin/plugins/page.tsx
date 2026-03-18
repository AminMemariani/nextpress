import { requirePermission } from "@/lib/auth/guards";

/**
 * Plugins page — requires "manage_plugins" permission.
 * Only admins and super_admins.
 */
export default async function PluginsPage() {
  const auth = await requirePermission("manage_plugins");

  return (
    <div>
      <h1 className="text-2xl font-bold">Plugins</h1>
      {/* PluginList component would go here */}
    </div>
  );
}
