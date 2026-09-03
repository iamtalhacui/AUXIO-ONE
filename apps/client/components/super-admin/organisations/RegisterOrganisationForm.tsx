"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useRegisterOrganisationMutation } from "@/lib/api/platformAuthApi";
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
  { value: "BASIC", label: "Basic", modules: "Home, CRM, Customers, Workforce, Schedule" },
  { value: "ADVANCED", label: "Advanced", modules: "All 9 modules" },
];

const inputClass = "input-field";

export function RegisterOrganisationForm() {
  const router = useRouter();
  const [register, { isLoading, error, reset }] = useRegisterOrganisationMutation();
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState(timeZones[0]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [plan, setPlan] = useState<OrgPlan>("BASIC");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [success, setSuccess] = useState("");

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
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
