"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { moduleCatalogue } from "@/lib/dashboard/content/super-admin";
import {
  ASSIGNABLE_MODULE_CODES,
  getModuleCodesForTemplate,
  MODULE_CEILING_TEMPLATES,
  type ModuleCeilingTemplate,
} from "@/lib/dashboard/content/module-templates";
import { useCreateOrganisationMutation } from "@/lib/api/api";
import { getErrorMessage } from "@/lib/api/getErrorMessage";

const timeZones = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Australia/Adelaide",
];

export function RegisterOrganisationForm() {
  const router = useRouter();
  const [createOrganisation, { isLoading }] = useCreateOrganisationMutation();

  const assignableModules = useMemo(
    () => moduleCatalogue.filter((module) => ASSIGNABLE_MODULE_CODES.includes(module.code as (typeof ASSIGNABLE_MODULE_CODES)[number])),
    [],
  );

  const moduleNameByCode = useMemo(
    () => Object.fromEntries(moduleCatalogue.map((module) => [module.code, module.name])),
    [],
  );

  const [legalName, setLegalName] = useState("");
  const [tradingName, setTradingName] = useState("");
  const [timeZone, setTimeZone] = useState(timeZones[0]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [template, setTemplate] = useState<ModuleCeilingTemplate>("BASIC");
  const [customModules, setCustomModules] = useState<string[]>(["03", "05", "06"]);
  const [orgAdminName, setOrgAdminName] = useState("");
  const [orgAdminEmail, setOrgAdminEmail] = useState("");
  const [orgAdminPassword, setOrgAdminPassword] = useState("");
  const [orgAdminPasswordConfirm, setOrgAdminPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resolvedModules =
    template === "CUSTOM" ? customModules : getModuleCodesForTemplate(template);

  function selectTemplate(next: ModuleCeilingTemplate) {
    setTemplate(next);
    if (next !== "CUSTOM") {
      setCustomModules(getModuleCodesForTemplate(next));
    }
  }

  function toggleCustomModule(code: string) {
    setCustomModules((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (resolvedModules.length === 0) {
      setError("Select at least one module for the custom ceiling.");
      return;
    }

    if (orgAdminPassword.length < 8) {
      setError("Org Admin password must be at least 8 characters.");
      return;
    }

    if (orgAdminPassword !== orgAdminPasswordConfirm) {
      setError("Org Admin passwords do not match.");
      return;
    }

    try {
      const result = await createOrganisation({
        legalName,
        tradingName: tradingName || undefined,
        contactEmail,
        contactPhone: contactPhone || undefined,
        timeZone,
        moduleCeilingTemplate: template,
        moduleCeilingCodes: template === "CUSTOM" ? customModules : undefined,
        orgAdminEmail,
        orgAdminName,
        orgAdminPassword,
      }).unwrap();

      setSuccess(
        `Organisation "${result.organisation.tradingName ?? result.organisation.legalName}" created with ${result.moduleEntitlements.length} modules in the ceiling. Org Admin ${result.orgAdmin.email} can sign in now.`,
      );

      setTimeout(() => router.push("/super-admin/organisations"), 2000);
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
        <h2 className="text-lg font-semibold">Module ceiling template</h2>
        <p className="mt-1 text-sm text-muted">
          Choose a preset or build a custom ceiling. Selected modules are saved to the organisation and define what the Org Admin may enable later.
        </p>

        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          {MODULE_CEILING_TEMPLATES.map((option) => {
            const active = template === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => selectTemplate(option.value)}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  active
                    ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                    : "border-border bg-background hover:border-primary/20"
                }`}
              >
                <p className="text-sm font-semibold">{option.label}</p>
                <p className="mt-2 text-sm text-muted">{option.description}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium">
              {template === "CUSTOM" ? "Choose modules" : "Modules in this ceiling"}
            </p>
            <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-muted">
              {resolvedModules.length} selected
            </span>
          </div>

          {template === "CUSTOM" ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {assignableModules.map((module) => (
                <label
                  key={module.code}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background px-4 py-3 transition hover:border-primary/20"
                >
                  <input
                    type="checkbox"
                    checked={customModules.includes(module.code)}
                    onChange={() => toggleCustomModule(module.code)}
                    className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                  />
                  <span>
                    <span className="block text-sm font-medium">{module.name}</span>
                    <span className="text-xs text-muted">Code {module.code}</span>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {resolvedModules.map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm"
                >
                  <span className="font-semibold text-primary">{code}</span>
                  <span className="text-muted">{moduleNameByCode[code]}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-card p-6">
        <h2 className="text-lg font-semibold">First Org Admin</h2>
        <p className="mt-1 text-sm text-muted">
          Creates the organisation&apos;s first administrator. They can sign in immediately and manage modules within the granted ceiling.
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

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Password</span>
            <input
              type="password"
              value={orgAdminPassword}
              onChange={(event) => setOrgAdminPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Confirm password</span>
            <input
              type="password"
              value={orgAdminPasswordConfirm}
              onChange={(event) => setOrgAdminPasswordConfirm(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
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
