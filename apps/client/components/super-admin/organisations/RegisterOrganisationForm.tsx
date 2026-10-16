"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import {
  useListPlatformModulesQuery,
  useRegisterOrganisationMutation,
} from "@/lib/api/platformAuthApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import type { BillingCycle, OrgPlan } from "@/lib/api/types";
import { AU_TIMEZONES, DEFAULT_AU_TIMEZONE } from "@/lib/timezones/au";

const PLANS: {
  value: OrgPlan;
  label: string;
  blurb: string;
  modules: string[];
}[] = [
  {
    value: "BASIC",
    label: "Basic",
    blurb: "Core ops for smaller providers",
    modules: ["Workforce", "Customers", "Schedule", "Service Delivery", "Incidents"],
  },
  {
    value: "ADVANCED",
    label: "Advanced",
    blurb: "Full suite for growing teams",
    modules: ["Everything in Basic", "Dashboard", "CRM", "Finance"],
  },
  {
    value: "CUSTOM",
    label: "Custom",
    blurb: "Core modules plus your add-ons",
    modules: ["Everything in Basic", "Choose add-ons below"],
  },
];

const STEPS = ["Organisation", "Plan", "Admin"] as const;

function todayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addBillingPeriod(startIso: string, cycle: BillingCycle): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startIso);
  if (!match) return "—";
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (cycle === "YEARLY") {
    date.setUTCFullYear(date.getUTCFullYear() + 1);
  } else {
    date.setUTCMonth(date.getUTCMonth() + 1);
  }
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function RegisterOrganisationForm() {
  const router = useRouter();
  const [register, { isLoading, error, reset }] = useRegisterOrganisationMutation();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState(DEFAULT_AU_TIMEZONE);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [plan, setPlan] = useState<OrgPlan>("BASIC");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");
  const [startDate, setStartDate] = useState(todayIsoDate);
  const [autoRenewal, setAutoRenewal] = useState(true);
  const [addOns, setAddOns] = useState<string[]>([]);
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [success, setSuccess] = useState("");
  const [stepError, setStepError] = useState("");

  const { data: catalogue = [] } = useListPlatformModulesQuery();
  const coreModules = catalogue.filter((mod) => mod.isCore);
  const optionalModules = catalogue.filter((mod) => !mod.isCore);

  const nextRenewalPreview = useMemo(
    () => addBillingPeriod(startDate, billingCycle),
    [startDate, billingCycle],
  );

  function toggleAddOn(code: string) {
    setAddOns((current) =>
      current.includes(code)
        ? current.filter((existing) => existing !== code)
        : [...current, code],
    );
  }

  function validateStep(current: number): string | null {
    if (current === 0) {
      if (!name.trim()) return "Organisation name is required.";
      if (!contactEmail.trim()) return "Contact email is required.";
    }
    if (current === 1) {
      if (!startDate) return "Subscription start date is required.";
    }
    if (current === 2) {
      if (!adminFirstName.trim() || !adminLastName.trim()) return "Admin name is required.";
      if (!adminEmail.trim()) return "Admin email is required.";
    }
    return null;
  }

  function goNext() {
    const message = validateStep(step);
    if (message) {
      setStepError(message);
      return;
    }
    setStepError("");
    setStep((value) => Math.min(value + 1, STEPS.length - 1));
  }

  function goBack() {
    setStepError("");
    setStep((value) => Math.max(value - 1, 0));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < STEPS.length - 1) {
      goNext();
      return;
    }

    const message = validateStep(step);
    if (message) {
      setStepError(message);
      return;
    }

    reset();
    setSuccess("");
    setStepError("");

    try {
      const result = await register({
        name,
        timezone,
        contactEmail,
        contactPhone: contactPhone || undefined,
        plan,
        moduleCodes: plan === "CUSTOM" ? addOns : undefined,
        billingCycle,
        startDate,
        autoRenewal,
        adminFirstName,
        adminLastName,
        adminEmail,
      }).unwrap();

      setSuccess(
        `${result.organisation.name} created. Setup email sent to ${result.admin.email}.`,
      );
      router.push(`/super-admin/organisations/${result.organisation.id}`);
    } catch {
      // error from RTK Query
    }
  }

  const errorMessage = error ? getErrorMessage(error, "Could not register organisation") : null;
  const banner = stepError || errorMessage;
  const selectedPlan = PLANS.find((item) => item.value === plan);

  return (
    <form className="reg-shell" onSubmit={handleSubmit} noValidate>
      <div className="reg-panel">
        <div className="reg-progress">
          <div className="reg-progress-top">
            <p className="reg-progress-meta">
              Step {step + 1} of {STEPS.length}
            </p>
            {step > 0 ? (
              <button type="button" onClick={goBack} className="reg-step-back">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Previous step
              </button>
            ) : null}
          </div>
          <ol className="reg-steps" aria-label="Registration progress">
            {STEPS.map((label, index) => {
              const done = index < step;
              const active = index === step;
              const filled = index <= step;
              return (
                <li
                  key={label}
                  className={`reg-step ${active ? "reg-step-active" : ""} ${done ? "reg-step-done" : ""}`}
                >
                  <span className="reg-step-marker" aria-hidden>
                    {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : index + 1}
                  </span>
                  <span className="reg-step-label">{label}</span>
                  <span className={`reg-step-track ${filled ? "reg-step-track-filled" : ""}`} aria-hidden />
                </li>
              );
            })}
          </ol>
        </div>

        {step === 0 ? (
          <section className="reg-section">
            <header className="reg-section-head">
              <h2 className="reg-section-title">Organisation details</h2>
              <p className="reg-section-desc">Identity used for invites, billing, and audit logs.</p>
            </header>
            <div className="reg-grid">
              <label className="reg-field reg-field-full">
                <span className="input-label">Organisation name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. ABC NDIS Support"
                  className="input-field"
                  autoFocus
                />
              </label>
              <label className="reg-field">
                <span className="input-label">Timezone</span>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="input-field"
                >
                  {AU_TIMEZONES.map((zone) => (
                    <option key={zone.value} value={zone.value}>
                      {zone.label}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs text-muted">
                  {AU_TIMEZONES.find((z) => z.value === timezone)?.hint ??
                    "Shift times use this timezone."}
                </span>
              </label>
              <label className="reg-field">
                <span className="input-label">
                  Phone <span className="font-normal text-muted">(optional)</span>
                </span>
                <input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+61 …"
                  className="input-field"
                />
              </label>
              <label className="reg-field reg-field-full">
                <span className="input-label">Contact email</span>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                  placeholder="ops@provider.com.au"
                  className="input-field"
                />
              </label>
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="reg-section">
            <header className="reg-section-head">
              <h2 className="reg-section-title">Choose a plan</h2>
              <p className="reg-section-desc">
                Modules entitled on day one, plus billing cycle for the subscription.
              </p>
            </header>

            <div className="reg-plan-grid" role="radiogroup" aria-label="Plan">
              {PLANS.map((option) => {
                const selected = plan === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPlan(option.value)}
                    className={`reg-plan-card ${selected ? "reg-plan-card-active" : ""}`}
                  >
                    <span className="reg-plan-top">
                      <span className="reg-plan-name">{option.label}</span>
                      <span className="reg-plan-radio" aria-hidden>
                        {selected ? <Check className="h-3 w-3" strokeWidth={2.5} /> : null}
                      </span>
                    </span>
                    <span className="reg-plan-blurb">{option.blurb}</span>
                    <ul className="reg-plan-list">
                      {option.modules.map((mod) => (
                        <li key={mod}>{mod}</li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            {plan === "CUSTOM" ? (
              <div className="reg-addons">
                <div className="reg-addons-head">
                  <p className="text-sm font-semibold text-foreground">Add-on modules</p>
                  <p className="text-xs text-muted">
                    Core included: {coreModules.map((mod) => mod.name).join(", ") || "—"}
                  </p>
                </div>
                <div className="reg-addon-grid">
                  {optionalModules.map((mod) => {
                    const checked = addOns.includes(mod.code);
                    return (
                      <label
                        key={mod.code}
                        className={`reg-addon ${checked ? "reg-addon-active" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAddOn(mod.code)}
                          className="sr-only"
                        />
                        <span className="reg-addon-check" aria-hidden>
                          {checked ? <Check className="h-3 w-3" strokeWidth={2.5} /> : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {mod.name}
                          </span>
                          <span className="mt-0.5 block text-xs leading-snug text-muted">
                            {mod.description || mod.code}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="mt-6 space-y-4 border-t border-border/60 pt-6">
              <header>
                <h3 className="text-sm font-semibold text-foreground">Subscription billing</h3>
                <p className="mt-1 text-xs text-muted">
                  Next renewal is calculated from the start date and billing cycle.
                </p>
              </header>

              <div className="reg-grid">
                <fieldset className="reg-field">
                  <legend className="input-label">Billing cycle</legend>
                  <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Billing cycle">
                    {(
                      [
                        { value: "MONTHLY", label: "Monthly" },
                        { value: "YEARLY", label: "Yearly" },
                      ] as const
                    ).map((option) => {
                      const selected = billingCycle === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setBillingCycle(option.value)}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-surface text-foreground hover:border-primary/40"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <label className="reg-field">
                  <span className="input-label">Start date</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="input-field"
                  />
                </label>

                <label className="reg-field reg-field-full flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 bg-surface-subtle/40 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={autoRenewal}
                    onChange={(e) => setAutoRenewal(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border text-primary"
                  />
                  <span>
                    <span className="block text-sm font-medium text-foreground">Auto renewal</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      When enabled, approving payment advances the next renewal period automatically.
                    </span>
                  </span>
                </label>
              </div>

              <p className="rounded-lg border border-border/60 bg-surface-subtle/50 px-4 py-3 text-sm text-muted">
                Next renewal date:{" "}
                <span className="font-medium text-foreground">
                  {formatDisplayDate(nextRenewalPreview)}
                </span>
              </p>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="reg-section">
            <header className="reg-section-head">
              <h2 className="reg-section-title">Invite organisation admin</h2>
              <p className="reg-section-desc">They get a secure setup link to create their password.</p>
            </header>

            <div className="reg-summary">
              <div>
                <p className="reg-summary-label">Organisation</p>
                <p className="reg-summary-value">{name || "—"}</p>
              </div>
              <div className="reg-summary-divider" aria-hidden />
              <div>
                <p className="reg-summary-label">Plan</p>
                <p className="reg-summary-value">{selectedPlan?.label ?? plan}</p>
              </div>
              <div className="reg-summary-divider" aria-hidden />
              <div>
                <p className="reg-summary-label">Billing</p>
                <p className="reg-summary-value">
                  {billingCycle === "YEARLY" ? "Yearly" : "Monthly"} · renews{" "}
                  {formatDisplayDate(nextRenewalPreview)}
                </p>
              </div>
            </div>

            <div className="reg-grid">
              <label className="reg-field">
                <span className="input-label">First name</span>
                <input
                  value={adminFirstName}
                  onChange={(e) => setAdminFirstName(e.target.value)}
                  required
                  className="input-field"
                  autoFocus
                />
              </label>
              <label className="reg-field">
                <span className="input-label">Last name</span>
                <input
                  value={adminLastName}
                  onChange={(e) => setAdminLastName(e.target.value)}
                  required
                  className="input-field"
                />
              </label>
              <label className="reg-field reg-field-full">
                <span className="input-label">Work email</span>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  placeholder="admin@provider.com.au"
                  className="input-field"
                />
              </label>
            </div>
          </section>
        ) : null}

        {banner ? <p className="reg-banner reg-banner-error">{banner}</p> : null}
        {success ? <p className="reg-banner reg-banner-ok">{success}</p> : null}

        <footer className="reg-footer">
          {step > 0 ? (
            <button type="button" onClick={goBack} className="reg-btn-ghost">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Previous
            </button>
          ) : (
            <span />
          )}

          {step < STEPS.length - 1 ? (
            <button type="submit" className="btn-primary gap-2">
              Continue
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <button type="submit" disabled={isLoading} className="btn-primary gap-2 disabled:opacity-70">
              {isLoading ? "Registering…" : "Register organisation"}
            </button>
          )}
        </footer>
      </div>
    </form>
  );
}
