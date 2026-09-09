import type { NavGroup, NavItem } from "@/lib/dashboard/config";

function filterItem(item: NavItem, enabled: Set<string>): NavItem | null {
  if (item.module && !enabled.has(item.module)) return null;

  if (!item.children?.length) return item;

  const children = item.children
    .map((child) => filterItem(child, enabled))
    .filter((child): child is NavItem => child !== null);

  if (item.href) return { ...item, children };
  if (children.length === 0) return null;
  return { ...item, children };
}

export function filterNavByModules(groups: NavGroup[], enabledCodes: string[]): NavGroup[] {
  const enabled = new Set(enabledCodes);

  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .map((item) => filterItem(item, enabled))
        .filter((item): item is NavItem => item !== null),
    }))
    .filter((group) => group.items.length > 0);
}
