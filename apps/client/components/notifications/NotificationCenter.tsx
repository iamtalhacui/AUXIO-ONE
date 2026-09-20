"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import {
  useListNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/lib/api/authApi";
import {
  useListPlatformNotificationsQuery,
  useMarkAllPlatformNotificationsReadMutation,
  useMarkPlatformNotificationReadMutation,
} from "@/lib/api/platformAuthApi";
import type { AppNotification, NotificationType } from "@/lib/api/types";
import { LIVE_POLL_MS } from "@/lib/api/liveRefresh";

const TYPE_ICON: Record<NotificationType, typeof Info> = {
  INFO: Info,
  SUCCESS: CheckCircle2,
  WARNING: AlertTriangle,
  ERROR: XCircle,
};

const TYPE_ICON_CLASS: Record<NotificationType, string> = {
  INFO: "text-primary bg-primary/10",
  SUCCESS: "text-emerald-600 bg-emerald-50",
  WARNING: "text-amber-600 bg-amber-50",
  ERROR: "text-red-600 bg-red-50",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/**
 * Global bell icon + slide-over drawer. Works for both organisation users
 * and Super Admins — picks the right API based on `isPlatform`. Poll interval
 * keeps the unread badge fresh without any websocket/queue infra.
 */
export function NotificationCenter({ isPlatform, enabled }: { isPlatform: boolean; enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const router = useRouter();

  const orgFeed = useListNotificationsQuery(undefined, {
    skip: isPlatform || !enabled,
    pollingInterval: enabled && !isPlatform ? LIVE_POLL_MS.notifications : 0,
  });
  const platformFeed = useListPlatformNotificationsQuery(undefined, {
    skip: !isPlatform || !enabled,
    pollingInterval: enabled && isPlatform ? LIVE_POLL_MS.notifications : 0,
  });

  const [markOrgRead] = useMarkNotificationReadMutation();
  const [markAllOrgRead] = useMarkAllNotificationsReadMutation();
  const [markPlatformRead] = useMarkPlatformNotificationReadMutation();
  const [markAllPlatformRead] = useMarkAllPlatformNotificationsReadMutation();

  const feed = isPlatform ? platformFeed.data : orgFeed.data;
  const items = feed?.items ?? [];
  const unreadCount = feed?.unreadCount ?? 0;
  const refetchFeed = isPlatform ? platformFeed.refetch : orgFeed.refetch;

  function handleOpen() {
    setClosing(false);
    setOpen(true);
    void refetchFeed();
  }

  function handleClose() {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 220);
  }

  function handleMarkRead(notification: AppNotification) {
    if (notification.isRead) return;
    if (isPlatform) void markPlatformRead(notification.id);
    else void markOrgRead(notification.id);
  }

  function handleMarkAllRead() {
    if (isPlatform) void markAllPlatformRead();
    else void markAllOrgRead();
  }

  function handleNotificationClick(notification: AppNotification) {
    handleMarkRead(notification);
    if (notification.link) {
      router.push(notification.link);
      handleClose();
    }
  }

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!enabled) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-surface text-muted transition hover:border-primary/30 hover:text-primary"
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-surface">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[90]">
          <div
            className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity ${
              closing ? "opacity-0" : "animate-drawer-overlay-in opacity-100"
            }`}
            onClick={handleClose}
            aria-hidden
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
            className={`absolute inset-y-0 right-0 flex h-full w-full max-w-sm flex-col border-l border-border bg-surface shadow-2xl transition-transform duration-200 ${
              closing ? "translate-x-full" : "animate-drawer-panel-in translate-x-0"
            }`}
          >
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Notifications</h2>
                {unreadCount > 0 ? (
                  <p className="text-xs text-muted">{unreadCount} unread</p>
                ) : (
                  <p className="text-xs text-muted">You&apos;re all caught up</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/8"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full p-1.5 text-muted transition hover:bg-surface-muted hover:text-foreground"
                  aria-label="Close notifications"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                    <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                  <Bell className="h-8 w-8 text-border" />
                  <p className="text-sm font-medium text-foreground">No notifications yet</p>
                  <p className="text-xs text-muted">
                    Updates about your workspace will show up here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {items.map((n) => {
                    const Icon = TYPE_ICON[n.type];
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => handleNotificationClick(n)}
                          className={`flex w-full items-start gap-3 px-5 py-3.5 text-left transition hover:bg-[#fafbfc] ${
                            n.isRead ? "" : "bg-primary/[0.03]"
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${TYPE_ICON_CLASS[n.type]}`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span
                                className={`truncate text-sm ${n.isRead ? "font-medium text-foreground/80" : "font-semibold text-foreground"}`}
                              >
                                {n.title}
                              </span>
                              {!n.isRead ? (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                              ) : null}
                            </span>
                            <span className="mt-0.5 block text-sm leading-snug text-muted">
                              {n.message}
                            </span>
                            <span className="mt-1 block text-xs text-muted/80">
                              {timeAgo(n.createdAt)}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
