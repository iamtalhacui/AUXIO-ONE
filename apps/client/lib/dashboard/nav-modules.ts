import type { RolePermissionsPayload } from "@/lib/api/types";
import type { NavGroup, NavItem } from "@/lib/dashboard/config";

function filterItem(
  item: NavItem,
  enabled: Set<string>,
  pages: Set<string> | null,
): NavItem | null {
  if (item.module && !enabled.has(item.module)) return null;
  if (item.page && pages && !pages.has(item.page)) return null;

  if (!item.children?.length) return item;

  const children = item.children
    .map((child) => filterItem(child, enabled, pages))
    .filter((child): child is NavItem => child !== null);

  if (item.href) return { ...item, children };
  if (children.length === 0) return null;
  return { ...item, children };
}

/**
 * First reachable page in an already module-filtered nav tree.
 * Used as the landing page for roles whose DASHBOARD module is disabled.
 */
export function findFirstNavHref(
  groups: NavGroup[],
  basePath: string,
): string | null {
  function walk(items: NavItem[]): string | null {
    for (const item of items) {
      if (item.href && item.href !== basePath && !item.locked) return item.href;
      const nested = item.children ? walk(item.children) : null;
      if (nested) return nested;
    }
    return null;
  }

  for (const group of groups) {
    const href = walk(group.items);
    if (href) return href;
  }
  return null;
}

export function filterNavByModules(
  groups: NavGroup[],
  enabledCodes: string[],
  permissions?: RolePermissionsPayload | null,
  /** ORG_ADMIN bypasses page filters. */
  bypassPagePermissions = false,
): NavGroup[] {
  const enabled = new Set(enabledCodes);
  const pages =
    bypassPagePermissions || !permissions
      ? null
      : new Set(
          Object.entries(permissions.pages)
            .filter(([, on]) => on)
            .map(([key]) => key),
        );

  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .map((item) => filterItem(item, enabled, pages))
        .filter((item): item is NavItem => item !== null),
    }))
    .filter((group) => group.items.length > 0);
}
