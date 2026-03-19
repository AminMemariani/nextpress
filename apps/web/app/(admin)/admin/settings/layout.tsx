import { requirePermission } from "@/lib/auth/guards";
import Link from "next/link";

/**
 * Settings layout — provides tabbed navigation between setting groups.
 */
export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("manage_settings");

  const tabs = [
    { href: "/admin/settings/general", label: "General" },
    { href: "/admin/settings/reading", label: "Reading" },
    { href: "/admin/settings/discussion", label: "Discussion" },
    { href: "/admin/settings/permalinks", label: "Permalinks" },
    { href: "/admin/settings/media", label: "Media" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="flex gap-1 border-b mb-6">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="px-4 py-2 text-sm font-medium border-b-2 -mb-px border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            {tab.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
