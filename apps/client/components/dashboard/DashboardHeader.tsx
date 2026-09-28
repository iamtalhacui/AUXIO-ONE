"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, HelpCircle, LogOut, Search } from "lucide-react";
import type { DashboardConfig, NavGroup, NavItem } from "@/lib/dashboard/config";
import { isNavItemActive } from "@/lib/dashboard/config";
import { site } from "@/lib/content";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { logoutOrg } from "@/lib/store/orgAuthSlice";
import { logoutPlatform } from "@/lib/store/platformAuthSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";

type SearchableItem = { label: string; href: string; group: string };

/** Deepest matching nav item label for the current route, used as the page title. */
function findActiveLabel(groups: NavGroup[], pathname: string, basePath: string): string | null {
  const best: { label: string; len: number } = { label: "", len: -1 };

  function visit(items: NavItem[]) {
    for (const item of items) {
      if (item.href && isNavItemActive(pathname, item, basePath) && item.href.length > best.len) {
        best.label = item.label;
        best.len = item.href.length;
      }
      if (item.children) visit(item.children);
    }
  }

  groups.forEach((group) => visit(group.items));
  return best.len >= 0 ? best.label : null;
}

function flattenSearchable(groups: NavGroup[]): SearchableItem[] {
  const out: SearchableItem[] = [];

  function visit(items: NavItem[], group: string) {
    for (const item of items) {
      if (item.href && !item.locked) out.push({ label: item.label, href: item.href, group });
      if (item.children) visit(item.children, group);
    }
  }

  groups.forEach((group) => visit(group.items, group.title));
  return out;
}

type DashboardHeaderProps = {
  config: DashboardConfig;
  isPlatform: boolean;
  notificationsEnabled: boolean;
};

export function DashboardHeader({ config, isPlatform, notificationsEnabled }: DashboardHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const platformUser = useAppSelector((state) => state.platformAuth.user);
  const orgUser = useAppSelector((state) => state.orgAuth.user);

  const [accountOpen, setAccountOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const pageTitle = useMemo(
    () => findActiveLabel(config.sidebarGroups, pathname, config.basePath) ?? config.title,
    [config, pathname],
  );

  const searchable = useMemo(() => flattenSearchable(config.sidebarGroups), [config]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return searchable.slice(0, 8);
    return searchable.filter((item) => item.label.toLowerCase().includes(q)).slice(0, 8);
  }, [query, searchable]);

  const displayName = isPlatform
    ? (platformUser?.name ?? config.roleLabel)
    : orgUser
      ? `${orgUser.firstName} ${orgUser.lastName}`
      : config.roleLabel;
  const email = isPlatform ? platformUser?.email : orgUser?.email;
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function openPalette() {
    setPaletteOpen(true);
    setQuery("");
    setActiveIndex(0);
  }

  function closePalette() {
    setPaletteOpen(false);
  }

  function goTo(href: string) {
    router.push(href);
    closePalette();
  }

  function handleSignOut() {
    setAccountOpen(false);
    if (isPlatform) {
      dispatch(logoutPlatform());
      router.replace("/platform/login");
      return;
    }
    dispatch(logoutOrg());
    router.replace("/login");
  }

  // Global ⌘K / Ctrl+K to open the search palette.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPalette();
      }
      if (event.key === "Escape") {
        setPaletteOpen(false);
        setAccountOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (paletteOpen) inputRef.current?.focus();
  }, [paletteOpen]);

  function handlePaletteKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = filtered[activeIndex];
      if (item) goTo(item.href);
    }
  }

  return (
    <header className="hdr-root">
      <div className="hdr-left">
        <p className="hdr-title">{pageTitle}</p>
        <p className="hdr-subtitle">{config.roleLabel}</p>
      </div>

      <div className="hdr-right">
        <button type="button" onClick={openPalette} className="hdr-search-trigger" aria-label="Search navigation">
          <Search className="h-4 w-4" aria-hidden />
          <span className="hdr-search-trigger-label">Search</span>
          <kbd className="hdr-kbd">⌘K</kbd>
        </button>

        <ThemeToggle />

        <a
          href={`mailto:${site.contactEmail}`}
          className="hdr-icon-btn"
          aria-label="Help and support"
          title="Help and support"
        >
          <HelpCircle className="h-[18px] w-[18px]" aria-hidden />
        </a>

        {notificationsEnabled ? (
          <NotificationCenter isPlatform={isPlatform} enabled={notificationsEnabled} />
        ) : null}

        <div className="hdr-divider-v" aria-hidden />

        <div className="relative">
          <button
            type="button"
            onClick={() => setAccountOpen((value) => !value)}
            className="hdr-avatar-btn"
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={accountOpen}
          >
            <span className="hdr-avatar">{initials}</span>
            <ChevronDown className={`hdr-avatar-chevron ${accountOpen ? "rotate-180" : ""}`} aria-hidden />
          </button>

          {accountOpen ? (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setAccountOpen(false)} />
              <div className="hdr-menu" role="menu">
                <div className="hdr-menu-header">
                  <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                  <p className="truncate text-xs text-muted">{email ?? config.roleLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="hdr-menu-item hdr-menu-item-danger"
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  Sign out
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {paletteOpen ? (
        <div className="hdr-palette-overlay" onClick={closePalette}>
          <div
            className="hdr-palette"
            role="dialog"
            aria-modal="true"
            aria-label="Search navigation"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="hdr-palette-input-wrap">
              <Search className="h-4 w-4 text-muted" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handlePaletteKeyDown}
                placeholder="Search pages…"
                className="hdr-palette-input"
                aria-label="Search pages"
              />
              <kbd className="hdr-kbd">Esc</kbd>
            </div>
            <ul className="hdr-palette-list" role="listbox">
              {filtered.length === 0 ? (
                <li className="hdr-palette-empty">No matching pages</li>
              ) : (
                filtered.map((item, index) => (
                  <li key={item.href}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => goTo(item.href)}
                      className={`hdr-palette-item ${index === activeIndex ? "hdr-palette-item-active" : ""}`}
                    >
                      <span className="hdr-palette-item-label">{item.label}</span>
                      <span className="hdr-palette-item-group">{item.group}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </header>
  );
}
