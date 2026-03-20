"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { useToast, Button } from "@nextpress/ui";
import { MenuItemTree } from "./menu-item-tree";
import type { MenuDto, MenuItemDto, MenuItemInput } from "@nextpress/core/menu/menu-types";

interface Props {
  locations: Array<{ slug: string; name: string; hasMenu: boolean }>;
  initialMenus: MenuDto[];
}

/**
 * Menu builder — select a location, add/remove/reorder items, save.
 *
 * Items can be:
 *   - Custom link (URL + label)
 *   - Content entry (search + select)
 *   - Taxonomy term (select from list)
 *
 * Items can be nested (drag into another item to make it a child).
 * Save sends the complete item tree — the service replaces all items.
 */
export function MenuBuilder({ locations, initialMenus }: Props) {
  const { toast } = useToast();
  const [activeLocation, setActiveLocation] = useState(locations[0]?.slug ?? "primary");
  const [menus, setMenus] = useState(initialMenus);
  const [isDirty, setIsDirty] = useState(false);
  const [addLabel, setAddLabel] = useState("");
  const [addUrl, setAddUrl] = useState("");

  const saveMutation = trpc.menu.save.useMutation({
    onSuccess: (menu) => {
      toast("success", "Menu saved");
      setMenus((prev) => prev.map((m) => (m.location === menu.location ? menu : m)));
      setIsDirty(false);
    },
    onError: (e) => toast("error", e.message),
  });

  const activeMenu = menus.find((m) => m.location === activeLocation);
  const items = activeMenu?.items ?? [];

  const setItems = useCallback((newItems: MenuItemDto[]) => {
    setMenus((prev) =>
      prev.map((m) =>
        m.location === activeLocation ? { ...m, items: newItems } : m,
      ),
    );
    setIsDirty(true);
  }, [activeLocation]);

  function addCustomLink() {
    if (!addLabel.trim()) return;
    const newItem: MenuItemDto = {
      id: `temp-${Date.now()}`,
      label: addLabel,
      url: addUrl || "#",
      type: "custom",
      objectId: null,
      parentId: null,
      sortOrder: items.length,
      cssClass: null,
      openInNewTab: addUrl.startsWith("http"),
      resolvedUrl: addUrl || "#",
      children: [],
    };
    setItems([...items, newItem]);
    setAddLabel("");
    setAddUrl("");
  }

  function handleSave() {
    const flatItems = flattenTree(items);
    const menuName = activeMenu?.name ?? locations.find((l) => l.slug === activeLocation)?.name ?? "Menu";
    saveMutation.mutate({
      location: activeLocation,
      name: menuName,
      items: flatItems,
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      {/* Left: add items */}
      <div className="space-y-4">
        {/* Location selector */}
        <div>
          <label className="text-sm font-medium text-gray-700">Location</label>
          <select
            value={activeLocation}
            onChange={(e) => { setActiveLocation(e.target.value); setIsDirty(false); }}
            className="np-input w-full mt-1"
          >
            {locations.map((loc) => (
              <option key={loc.slug} value={loc.slug}>
                {loc.name} {loc.hasMenu ? "" : "(empty)"}
              </option>
            ))}
          </select>
        </div>

        {/* Add custom link */}
        <div className="bg-white rounded-lg border p-4 space-y-2">
          <h3 className="text-sm font-semibold">Add Custom Link</h3>
          <input
            type="text"
            placeholder="Label"
            value={addLabel}
            onChange={(e) => setAddLabel(e.target.value)}
            className="np-input w-full"
          />
          <input
            type="url"
            placeholder="https://..."
            value={addUrl}
            onChange={(e) => setAddUrl(e.target.value)}
            className="np-input w-full"
          />
          <Button size="sm" variant="outline" onClick={addCustomLink} disabled={!addLabel.trim()}>
            Add to Menu
          </Button>
        </div>
      </div>

      {/* Right: item tree + save */}
      <div>
        <div className="bg-white rounded-lg border p-4 min-h-[300px]">
          {items.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No items. Add links from the left panel.
            </p>
          ) : (
            <MenuItemTree items={items} onUpdate={setItems} />
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            loading={saveMutation.isPending}
            disabled={!isDirty}
          >
            Save Menu
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Flatten nested tree to flat list with parentId references */
function flattenTree(items: MenuItemDto[], parentId?: string): MenuItemInput[] {
  const flat: MenuItemInput[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    flat.push({
      id: item.id,
      label: item.label,
      url: item.url,
      type: item.type,
      objectId: item.objectId,
      parentId: parentId ?? null,
      sortOrder: i,
      cssClass: item.cssClass,
      openInNewTab: item.openInNewTab,
    });
    if (item.children?.length) {
      flat.push(...flattenTree(item.children, item.id));
    }
  }
  return flat;
}
