import { notifications } from "@/lib/dashboard/content/super-admin";

export function NotificationsPageContent() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="dashboard-card p-5">
          <p className="text-sm text-muted">Unread</p>
          <p className="mt-2 text-3xl font-semibold text-primary">
            {notifications.filter((n) => !n.read).length}
          </p>
        </div>
        <div className="dashboard-card p-5">
          <p className="text-sm text-muted">Total</p>
          <p className="mt-2 text-3xl font-semibold text-primary">{notifications.length}</p>
        </div>
      </div>

      <div className="dashboard-card divide-y divide-border/60">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex gap-4 px-6 py-5 ${!notification.read ? "bg-primary/[0.03]" : ""}`}
          >
            <div
              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                notification.read ? "bg-border" : "bg-primary"
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{notification.title}</p>
                <span className="shrink-0 text-xs text-muted">{notification.time}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{notification.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
