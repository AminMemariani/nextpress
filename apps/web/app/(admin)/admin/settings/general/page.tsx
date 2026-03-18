import { requirePermission } from "@/lib/auth/guards";

/**
 * General Settings page — requires "manage_settings" permission.
 * Only admins and super_admins.
 */
export default async function GeneralSettingsPage() {
  const auth = await requirePermission("manage_settings");

  return (
    <div>
      <h1 className="text-2xl font-bold">General Settings</h1>
      {/* SettingsForm component would go here */}
    </div>
  );
}
