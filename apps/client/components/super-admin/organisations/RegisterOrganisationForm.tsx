"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { moduleCatalogue } from "@/lib/dashboard/content/super-admin";
import { useCreateOrganisationMutation } from "@/lib/api/api";
import { getErrorMessage } from "@/lib/api/getErrorMessage";

const timeZones = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Australia/Adelaide",
];

const defaultModuleCodes = ["03", "05", "06", "07", "09", "10"];

export function RegisterOrganisationForm() {
  const router = useRouter();
  const [createOrganisation, { isLoading }] = useCreateOrganisationMutation();

  const operationalModules = useMemo(
    () => moduleCatalogue.filter((module) => module.operational),
    [],
  );

  const [legalName, setLegalName] = useState("");
  const [tradingName, setTradingName] = useState("");
  const [timeZone, setTimeZone] = useState(timeZones[0]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [orgAdminName, setOrgAdminName] = useState("");
  const [orgAdminEmail, setOrgAdminEmail] = useState("");
  const [selectedModules, setSelectedModules] = useState<string[]>(defaultModuleCodes);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function toggleModule(code: string) {
    setSelectedModules((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (selectedModules.length === 0) {
      setError("Select at least one module for the ceiling.");
      return;
    }

    try {
      const result = await createOrganisation({
        legalName,
        tradingName: tradingName || undefined,
        contactEmail,
        contactPhone: contactPhone || undefined,
        timeZone,
        moduleCeilingCodes: selectedModules,
        orgAdminEmail,
        orgAdminName,
      }).unwrap();

      setSuccess(
        `Organisation "${result.organisation.tradingName ?? result.organisation.legalName}" created. Org Admin invite sent to ${result.orgAdmin.email}. Check the API server console for the temporary password.`,
      );

      setTimeout(() => router.push("/super-admin/organisations"), 1500);
    } catch (err) {
      setError(getErrorMessage(err, "Could not register organisation"));
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <section className="dashboard-card p-6">
        <h2 className="text-lg font-semibold">Organisation details</h2>
        <p className="mt-1 text-sm text-muted">Legal identity and primary contact for the tenant.</p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-medium">Legal name</span>
            <input
              value={legalName}
              onChange={(event) => setLegalName(event.target.value)}
              placeholder="Demo NDIS Provider Pty Ltd"
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Trading name</span>
            <input
              value={tradingName}
              onChange={(event) => setTradingName(event.target.value)}
              placeholder="Demo Care Services"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Time zone</span>
            <select
              value={timeZone}
              onChange={(event) => setTimeZone(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              {timeZones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Contact email</span>
            <input
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              placeholder="contact@demo-provider.com.au"
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Contact phone</span>
            <input
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
              placeholder="+61 400 000 000"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>
        </div>
      </section>

      <section className="dashboard-card p-6">
        <h2 className="text-lg font-semibold">Module ceiling</h2>
        <p className="mt-1 text-sm text-muted">
          Select which modules this organisation may ever enable. All start disabled until the Org Admin toggles them on.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {operationalModules.map((module) => (
            <label
              key={module.code}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background px-4 py-3 transition hover:border-primary/20"
            >
              <input
                type="checkbox"
                checked={selectedModules.includes(module.code)}
                onChange={() => toggleModule(module.code)}
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
              />
              <span>
                <span className="block text-sm font-medium">{module.name}</span>
                <span className="text-xs text-muted">Code {module.code}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="dashboard-card p-6">
        <h2 className="text-lg font-semibold">First Org Admin</h2>
        <p className="mt-1 text-sm text-muted">
          Creates the organisation&apos;s first administrator with a temporary password and invited status.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Full name</span>
            <input
              value={orgAdminName}
              onChange={(event) => setOrgAdminName(event.target.value)}
              placeholder="Demo Org Admin"
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Email address</span>
            <input
              type="email"
              value={orgAdminEmail}
              onChange={(event) => setOrgAdminEmail(event.target.value)}
              placeholder="orgadmin@demo-provider.com.au"
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>
        </div>
      </section>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          {success}
        </p>
      ) : null}

      <div className="dashboard-card flex flex-wrap gap-3 p-6">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-light disabled:opacity-70"
        >
          {isLoading ? "Registering..." : "Register organisation"}
        </button>
      </div>
    </form>
  );
}
