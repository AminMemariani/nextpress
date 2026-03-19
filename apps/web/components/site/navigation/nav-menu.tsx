import { getCachedMenu } from "@/lib/cache/cached-queries";
import type { MenuItemDto } from "@nextpress/core/menu/menu-types";

/**
 * Server component: renders a navigation menu from a theme location.
 *
 * Uses the cached menu query (tagged for revalidation).
 * Renders nested <ul>/<li> structure with proper accessibility attributes.
 */

interface Props {
  siteId: string;
  location: string;
  className?: string;
}

export async function NavMenu({ siteId, location, className }: Props) {
  const menu = await getCachedMenu(siteId, location);

  if (!menu || menu.items.length === 0) return null;

  return (
    <nav aria-label={menu.name} className={className}>
      <ul className="np-nav-menu flex gap-4">
        {menu.items.map((item: any) => (
          <NavItem key={item.id} item={item} />
        ))}
      </ul>
    </nav>
  );
}

function NavItem({ item }: { item: MenuItemDto }) {
  const url = item.resolvedUrl ?? item.url ?? "#";
  const hasChildren = item.children && item.children.length > 0;

  return (
    <li className={`np-nav-item ${item.cssClass ?? ""} ${hasChildren ? "np-has-children" : ""}`.trim()}>
      <a
        href={url}
        target={item.openInNewTab ? "_blank" : undefined}
        rel={item.openInNewTab ? "noopener noreferrer" : undefined}
        className="np-nav-link text-sm text-gray-700 hover:text-gray-900"
      >
        {item.label}
      </a>

      {hasChildren && (
        <ul className="np-nav-submenu ml-4 mt-1 space-y-1">
          {item.children.map((child) => (
            <NavItem key={child.id} item={child} />
          ))}
        </ul>
      )}
    </li>
  );
}
