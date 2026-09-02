"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  useGetOrganisationQuery,
  useListPlatformModulesQuery,
  useUpdateModuleCeilingMutation,
  useUpdateOrganisationMutation,
} from "@/lib/api/api";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { ASSIGNABLE_MODULE_CODES } from "@/lib/dashboard/content/module-templates";
import type { OrgStatus } from "@/lib/api/types";
import { OrgStatusBadge } from "@/components/dashboard/StatusBadge";

const timeZones = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Australia/Adelaide",
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrganisationDetailContent({ organisationId }: { organisationId: string }) {
  const { data, isLoading, error } = useGetOrganisationQuery(organisationId);
  const { data: platformModules = [] } = useListPlatformModulesQuery();
  const [updateOrganisation, { isLoading: isSavingDetails }] = useUpdateOrganisationMutation();
  const [updateModuleCeiling, { isLoading: isSavingCeiling }] = useUpdateModuleCeilingMutation();

  const assignableModules = useMemo(
    () =>
      platformModules.filter((module) =>
        ASSIGNABLE_MODULE_CODES.includes(module.code as (typeof ASSIGNABLE_MODULE_CODES)[number]),
      ),
    [platformModules],
  );

  const [legalName, setLegalName] = useState("");
  const [tradingName, setTradingName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [timeZone, setTimeZone] = useState(timeZones[0]);
  const [status, setStatus] = useState<OrgStatus>("ACTIVE");
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [detailsMessage, setDetailsMessage] = useState("");
  const [detailsError, setDetailsError] = useState("");
  const [ceilingMessage, setCeilingMessage] = useState("");
  const [ceilingError, setCeilingError] = useState("");

  useEffect(() => {
    if (!data) return;

    setLegalName(data.legalName);
    setTradingName(data.tradingName ?? "");
    setContactEmail(data.contactEmail);
    setContactPhone(data.contactPhone ?? "");
    setTimeZone(data.timeZone);
    setStatus(data.status);
    setSelectedModules(data.moduleEntitlements.map((item) => item.moduleCode));
  }, [data]);

  function toggleModule(code: string) {
    setSelectedModules((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    );
  }

  async function handleSaveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDetailsMessage("");
    setDetailsError("");

    try {
      await updateOrganisation({
        id: organisationId,
        body: {
          legalName,
          tradingName: tradingName || undefined,
          contactEmail,
          contactPhone: contactPhone || undefined,
          timeZone,
          status,
        },
      }).unwrap();
      setDetailsMessage("Organisation details saved.");
    } catch (err) {
      setDetailsError(getErrorMessage(err, "Could not save organisation details"));
    }
  }

  async function handleSaveCeiling(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCeilingMessage("");
    setCeilingError("");

    if (selectedModules.length === 0) {
      setCeilingError("Select at least one module for the ceiling.");
      return;
    }

    try {
      await updateModuleCeiling({
        id: organisationId,
        body: { moduleCeilingCodes: selectedModules },
      }).unwrap();
      setCeilingMessage("Module ceiling updated.");
    } catch (err) {
      setCeilingError(getErrorMessage(err, "Could not update module ceiling"));
    }
  }

  if (isLoading) {
    return <div className="dashboard-card p-6 text-sm text-muted">Loading organisation...</div>;
  }

  if (error || !data) {
    return (
      <div className="dashboard-card p-6 text-sm text-red-700">
        {getErrorMessage(error, "Organisation not found")}
      </div>
    );
  }

  const enabledModules = data.moduleEntitlements.filter((item) => item.enabled);

  return (
    <div className="space-y-6">
      <Link
        href="/super-admin/organisations"
        className="inline-flex text-sm font-medium text-muted hover:text-primary"
      >
        ← Back to organisations
      </Link>

      <div className="dashboard-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Tenant</p>
            <h1 className="mt-2 text-2xl font-semibold">
              {data.tradingName ?? data.legalName}
            </h1>
            <p className="mt-1 text-sm text-muted">{data.legalName}</p>
          </div>
          <OrgStatusBadge status={data.status} />
        </div>
        <p className="mt-4 text-sm text-muted">
          Registered {formatDate(data.createdAt)} · Last updated {formatDate(data.updatedAt)}
        </p>
      </div>

      <form className="dashboard-card space-y-6 p-6" onSubmit={handleSaveDetails}>
        <div>
          <h2 className="text-lg font-semibold">Organisation details</h2>
          <p className="mt-1 text-sm text-muted">Update legal identity, contact details, and status.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-medium">Legal name</span>
            <input
              value={legalName}
              onChange={(event) => setLegalName(event.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Trading name</span>
            <input
              value={tradingName}
              onChange={(event) => setTradingName(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as OrgStatus)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            >
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="CLOSED">Closed</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Contact email</span>
            <input
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Contact phone</span>
            <input
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-medium">Time zone</span>
            <select
              value={timeZone}
              onChange={(event) => setTimeZone(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            >
              {timeZones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </label>
        </div>

        {detailsError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {detailsError}
          </p>
        ) : null}
        {detailsMessage ? (
          <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            {detailsMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSavingDetails}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-light disabled:opacity-70"
        >
          {isSavingDetails ? "Saving..." : "Save details"}
        </button>
      </form>

      <div className="dashboard-card p-6">
        <h2 className="text-lg font-semibold">Org Admin</h2>
        {data.orgAdmin ? (
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Name</dt>
              <dd className="mt-1 text-sm font-medium">{data.orgAdmin.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Email</dt>
              <dd className="mt-1 text-sm font-medium">{data.orgAdmin.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Account status</dt>
              <dd className="mt-1 text-sm font-medium">{data.orgAdmin.status}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-muted">No Org Admin linked to this organisation.</p>
        )}
      </div>

      <form className="dashboard-card space-y-6 p-6" onSubmit={handleSaveCeiling}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Module ceiling</h2>
            <p className="mt-1 text-sm text-muted">
              Modules granted here define what the Org Admin may enable. Currently{" "}
              {enabledModules.length} of {data.moduleEntitlements.length} granted modules are enabled.
            </p>
          </div>
          <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-muted">
            {selectedModules.length} selected
          </span>
        </div>

        {enabledModules.length > 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Enabled modules cannot be removed from the ceiling until the Org Admin disables them:{" "}
            {enabledModules.map((item) => item.moduleCode).join(", ")}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {assignableModules.map((module) => {
            const isEnabled = data.moduleEntitlements.some(
              (item) => item.moduleCode === module.code && item.enabled,
            );
            const checked = selectedModules.includes(module.code);

            return (
              <label
                key={module.code}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition ${
                  checked
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-background hover:border-primary/20"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={isEnabled && checked}
                  onChange={() => toggleModule(module.code)}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/20 disabled:opacity-50"
                />
                <span>
                  <span className="block text-sm font-medium">{module.name}</span>
                  <span className="text-xs text-muted">
                    Code {module.code}
                    {isEnabled ? " · enabled in workspace" : ""}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        {ceilingError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {ceilingError}
          </p>
        ) : null}
        {ceilingMessage ? (
          <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            {ceilingMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSavingCeiling}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-light disabled:opacity-70"
        >
          {isSavingCeiling ? "Saving..." : "Save module ceiling"}
        </button>
      </form>
    </div>
  );
}
