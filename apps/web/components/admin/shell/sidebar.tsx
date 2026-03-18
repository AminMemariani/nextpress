"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

interface NavItem {
  href: string;
  label: string;
  icon?: string;
}

interface SidebarProps {
  items: NavItem[];
  siteName?: string;
}

export function Sidebar({ items, siteName }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r bg-gray-50 flex flex-col h-screen overflow-y-auto">
      {/* Brand */}
      <div className="px-4 py-4 border-b">
        <Link href="/admin" className="text-lg font-bold text-gray-900">
          {siteName ?? "NextPress"}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {items.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t text-xs text-gray-400">
        <Link href="/" className="hover:text-gray-600">
          View site →
        </Link>
      </div>
    </aside>
  );
}
