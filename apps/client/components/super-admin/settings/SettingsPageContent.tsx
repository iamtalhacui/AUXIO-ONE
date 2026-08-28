"use client";

import { platformSettings } from "@/lib/dashboard/content/super-admin";

export function SettingsPageContent() {
  return (
    <div className="space-y-6">
      <section className="dashboard-card p-6">
        <h2 className="text-lg font-semibold">General</h2>
        <p className="mt-1 text-sm text-muted">Platform-wide defaults for new organisations.</p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Default time zone</span>
            <select
              defaultValue={platformSettings.defaultTimeZone}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            >
              <option>Australia/Sydney</option>
              <option>Australia/Melbourne</option>
              <option>Australia/Brisbane</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Invite expiry (days)</span>
            <input
              type="number"
              defaultValue={platformSettings.inviteExpiryDays}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Max modules per org</span>
            <input
              type="number"
              defaultValue={platformSettings.maxModulesPerOrg}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Support contact email</span>
            <input
              type="email"
              defaultValue={platformSettings.supportEmail}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>
      </section>

      <section className="dashboard-card p-6">
        <h2 className="text-lg font-semibold">Maintenance</h2>
        <p className="mt-1 text-sm text-muted">Control platform availability for all tenants.</p>

        <label className="mt-6 flex items-center justify-between rounded-xl border border-border bg-background px-4 py-4">
          <span>
            <span className="block text-sm font-medium">Maintenance mode</span>
            <span className="text-xs text-muted">Blocks all org logins except Super Admin</span>
          </span>
          <input
            type="checkbox"
            defaultChecked={platformSettings.maintenanceMode}
            className="h-5 w-5 rounded border-border text-primary focus:ring-primary/20"
          />
        </label>
      </section>

      <div className="dashboard-card flex flex-wrap gap-3 p-6">
        <button
          type="button"
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-light"
        >
          Save changes
        </button>
        <button
          type="button"
          className="rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold hover:bg-surface-muted"
        >
          Reset defaults
        </button>
      </div>
    </div>
  );
}
