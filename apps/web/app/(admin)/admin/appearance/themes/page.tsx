import { requireAnyPermission } from "@/lib/auth/guards";
import { PageHeader } from "@nextpress/ui";

export default async function ThemesPage() {
  await requireAnyPermission(["switch_themes", "customize_theme"]);

  return (
    <div>
      <PageHeader title="Themes" description="Manage installed themes" />
      <p className="text-gray-500">Theme cards with screenshot, activate/deactivate, and customize buttons.</p>
    </div>
  );
}
