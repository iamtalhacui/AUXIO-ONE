"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ConstrainedDateInput } from "@/components/ui/ConstrainedDateInput";
import { ConstrainedSelect } from "@/components/ui/ConstrainedSelect";
import { useAppSelector } from "@/lib/store/hooks";
import { AU_STATES } from "@/lib/onboarding/constants";
import { useToast } from "@/components/toast/ToastProvider";

const GENDER_OPTIONS = ["Female", "Male", "Non-binary", "Prefer not to say", "Other"];

function roleLabel(role: string | undefined) {
  switch (role) {
    case "EMPLOYEE":
      return "Employee";
    case "ORG_ADMIN":
      return "Org Admin";
    case "MANAGER":
      return "Manager";
    case "ROSTERING_EXPERT":
      return "Rostering Expert";
    default:
      return role ?? "—";
  }
}

export function WorkforceProfileContent() {
  const { toast } = useToast();
  const user = useAppSelector((s) => s.orgAuth.user);
  const organisation = useAppSelector((s) => s.orgAuth.organisation);

  const fullName = useMemo(() => {
    if (!user) return "";
    return `${user.firstName} ${user.lastName}`.trim();
  }, [user]);

  const [form, setForm] = useState({
    phone: "",
    addressLine1: "",
    addressLine2: "",
    suburb: "",
    state: "",
    postcode: "",
    preferredName: "",
    dateOfBirth: "",
    gender: "",
    languages: "",
    bio: "",
  });
  const [dirty, setDirty] = useState(false);
  const [hydratedName, setHydratedName] = useState(false);

  useEffect(() => {
    if (!user || hydratedName) return;
    setForm((prev) => ({ ...prev, preferredName: user.firstName }));
    setHydratedName(true);
  }, [user, hydratedName]);

  function patch<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setDirty(false);
    toast({
      variant: "success",
      title: "Profile saved locally",
      description:
        "Contact details are kept on this device until profile sync is connected.",
    });
  }

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="Your profile"
        description="Your account details and the contact information your organisation uses."
      />

      <section className="dashboard-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border/50 bg-surface-subtle/50 px-5 py-5 sm:flex-row sm:items-center">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary"
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold tracking-tight text-foreground">
              {fullName || "Your name"}
            </p>
            <p className="mt-0.5 truncate text-sm text-muted">{user?.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="status-pill bg-primary/10 text-primary">
                {roleLabel(user?.role)}
              </span>
              {organisation?.tradingName || organisation?.name ? (
                <span className="status-pill bg-surface-muted text-muted">
                  {organisation.tradingName ?? organisation.name}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <dl className="grid gap-px bg-border/40 sm:grid-cols-2">
          <InfoRow label="Email" value={user?.email ?? "—"} />
          <InfoRow label="Role" value={roleLabel(user?.role)} />
          <InfoRow
            label="Organisation"
            value={organisation?.tradingName ?? organisation?.name ?? "—"}
          />
          <InfoRow
            label="Onboarding"
            value={user?.onboardingStatus?.replaceAll("_", " ") ?? "—"}
          />
        </dl>
      </section>

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="dashboard-card px-5 py-5">
          <h2 className="text-base font-semibold text-foreground">Contact</h2>
          <p className="mt-0.5 text-sm text-muted">
            How your team reaches you about shifts and care.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Phone" className="md:col-span-2">
              <input
                className="input-field"
                value={form.phone}
                onChange={(e) => patch("phone", e.target.value)}
                placeholder="Mobile number"
              />
            </Field>
            <Field label="Street address" className="md:col-span-2">
              <input
                className="input-field"
                value={form.addressLine1}
                onChange={(e) => patch("addressLine1", e.target.value)}
              />
            </Field>
            <Field label="Address line 2" className="md:col-span-2">
              <input
                className="input-field"
                value={form.addressLine2}
                onChange={(e) => patch("addressLine2", e.target.value)}
              />
            </Field>
            <Field label="Suburb">
              <input
                className="input-field"
                value={form.suburb}
                onChange={(e) => patch("suburb", e.target.value)}
              />
            </Field>
            <Field label="State">
              <ConstrainedSelect
                aria-label="State"
                value={form.state}
                placeholder="Select state"
                onChange={(next) => patch("state", next)}
                options={[
                  { value: "", label: "Select state" },
                  ...AU_STATES.map((state) => ({ value: state, label: state })),
                ]}
              />
            </Field>
            <Field label="Postcode">
              <input
                className="input-field"
                value={form.postcode}
                onChange={(e) => patch("postcode", e.target.value)}
              />
            </Field>
          </div>
        </section>

        <section className="dashboard-card px-5 py-5">
          <h2 className="text-base font-semibold text-foreground">Personal</h2>
          <p className="mt-0.5 text-sm text-muted">
            Optional details that help your organisation support you.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Preferred name">
              <input
                className="input-field"
                value={form.preferredName}
                onChange={(e) => patch("preferredName", e.target.value)}
              />
            </Field>
            <Field label="Date of birth">
              <ConstrainedDateInput
                aria-label="Date of birth"
                value={form.dateOfBirth}
                onChange={(next) => patch("dateOfBirth", next)}
              />
            </Field>
            <Field label="Gender">
              <ConstrainedSelect
                aria-label="Gender"
                value={form.gender}
                placeholder="Select gender"
                onChange={(next) => patch("gender", next)}
                options={[
                  { value: "", label: "Select gender" },
                  ...GENDER_OPTIONS.map((option) => ({
                    value: option,
                    label: option,
                  })),
                ]}
              />
            </Field>
            <Field label="Languages">
              <input
                className="input-field"
                value={form.languages}
                onChange={(e) => patch("languages", e.target.value)}
                placeholder="e.g. English, Arabic"
              />
            </Field>
            <Field label="Bio" className="md:col-span-2">
              <textarea
                className="input-field min-h-[100px] resize-none"
                value={form.bio}
                onChange={(e) => patch("bio", e.target.value)}
                placeholder="A short note about yourself"
              />
            </Field>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="submit"
            className="btn-primary disabled:opacity-50"
            disabled={!dirty}
          >
            {dirty ? "Save profile" : "Saved"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="input-label">{label}</span>
      {children}
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-5 py-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
