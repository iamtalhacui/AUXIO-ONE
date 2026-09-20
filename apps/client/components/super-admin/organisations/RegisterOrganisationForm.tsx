"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useListPlatformModulesQuery,
  useRegisterOrganisationMutation,
} from "@/lib/api/platformAuthApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import type { OrgPlan } from "@/lib/api/types";

const timeZones = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Australia/Adelaide",
];

const PLANS: { value: OrgPlan; label: string; modules: string }[] = [
  {
    value: "BASIC",
    label: "Basic",
    modules: "Workforce, Customers, Schedule, Service Delivery",
  },
  {
    value: "ADVANCED",
    label: "Advanced",
    modules: "Basic plus Dashboard, CRM, Finance Handoff, Incidents",
  },
  {
    value: "CUSTOM",
    label: "Custom",
    modules: "Basic plus the add-ons you choose below",
  },
];

const inputClass = "input-field";

// Super Admin registers a tenant, Org Admin, and plan modules in one submit.
export function RegisterOrganisationForm() {
  const router = useRouter();
  const [register, { isLoading, error, reset }] = useRegisterOrganisationMutation();
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState(timeZones[0]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [plan, setPlan] = useState<OrgPlan>("BASIC");
  const [addOns, setAddOns] = useState<string[]>([]);
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [success, setSuccess] = useState("");

  // Core vs optional comes from the live catalogue so this form can never
  // drift from the server's plan definitions.
  const { data: catalogue = [] } = useListPlatformModulesQuery();
  const coreModules = catalogue.filter((mod) => mod.isCore);
  const optionalModules = catalogue.filter((mod) => !mod.isCore);

  function toggleAddOn(code: string) {
    setAddOns((current) =>
      current.includes(code)
        ? current.filter((existing) => existing !== code)
        : [...current, code],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    reset();
    setSuccess("");

    try {
      const result = await register({
        name,
        timezone,
        contactEmail,
        contactPhone: contactPhone || undefined,
        plan,
        moduleCodes: plan === "CUSTOM" ? addOns : undefined,
        adminFirstName,
        adminLastName,
        adminEmail,
      }).unwrap();

      setSuccess(
        `${result.organisation.name} created. Setup email sent to ${result.admin.email}.`,
      );
      router.push("/super-admin/organisations");
    } catch {
      // error from RTK Query
    }
  }

  const errorMessage = error ? getErrorMessage(error, "Could not register organisation") : null;

  return (
    <form className="mx-auto max-w-2xl space-y-5" onSubmit={handleSubmit}>
      <section className="dashboard-card p-5">
        <h2 className="text-base font-semibold">Organisation</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="input-label">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
          </label>
          <label className="block">
            <span className="input-label">Timezone</span>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputClass}>
              {timeZones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="input-label">Phone</span>
            <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={inputClass} />
          </label>
          <label className="block sm:col-span-2">
            <span className="input-label">Contact email</span>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
              className={inputClass}
            />
          </label>
        </div>
      </section>

      <section className="dashboard-card p-5">
        <h2 className="text-base font-semibold">Plan</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {PLANS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPlan(option.value)}
              className={`rounded-lg border px-4 py-3 text-left ${
                plan === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <p className="text-sm font-semibold">{option.label}</p>
              <p className="mt-1 text-xs text-muted">{option.modules}</p>
            </button>
          ))}
        </div>

        {plan === "CUSTOM" ? (
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-sm font-medium">Add-on modules</p>
            <p className="mt-1 text-xs text-muted">
              {coreModules.map((mod) => mod.name).join(", ")} are included in
              every plan and cannot be removed.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {optionalModules.map((mod) => (
                <label
                  key={mod.code}
                  className="flex items-start gap-3 rounded-lg border border-border px-4 py-3"
                >
                  <input
                    type="checkbox"
                    checked={addOns.includes(mod.code)}
                    onChange={() => toggleAddOn(mod.code)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                  />
                  <span>
                    <span className="block text-sm font-medium">{mod.name}</span>
                    <span className="block text-xs text-muted">
                      {mod.description || mod.code}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="dashboard-card p-5">
        <h2 className="text-base font-semibold">Organisation admin</h2>
        <p className="mt-1 text-sm text-muted">They receive a setup link by email.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="input-label">First name</span>
            <input
              value={adminFirstName}
              onChange={(e) => setAdminFirstName(e.target.value)}
              required
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="input-label">Last name</span>
            <input
              value={adminLastName}
              onChange={(e) => setAdminLastName(e.target.value)}
              required
              className={inputClass}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="input-label">Email</span>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
              className={inputClass}
            />
          </label>
        </div>
      </section>

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          {success}
        </p>
      ) : null}

      <button type="submit" disabled={isLoading} className="btn-primary disabled:opacity-70">
        {isLoading ? "Registering…" : "Register organisation"}
      </button>
    </form>
  );
}
