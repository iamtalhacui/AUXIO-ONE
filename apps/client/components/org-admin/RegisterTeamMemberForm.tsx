"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useRegisterTeamMemberMutation } from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import type { WorkforceRole } from "@/lib/api/types";
import { REGISTERABLE_ROLES } from "@/lib/dashboard/content/org-admin-team";

// Invite a new Manager, Rostering Expert, or Employee to this organisation.
export function RegisterTeamMemberForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkforceRole>("EMPLOYEE");
  const [register, { isLoading, error, reset }] = useRegisterTeamMemberMutation();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    reset();

    try {
      await register({ firstName, lastName, email, role }).unwrap();
      router.replace("/org-admin/team");
    } catch {
      // RTK error
    }
  }

  const errorMessage = error ? getErrorMessage(error, "Could not send invite") : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Register team member"
        description="Invite a manager, rostering expert, or employee. They will receive an email link to set their password and sign in."
        action={
          <Link href="/org-admin/team" className="btn-secondary">
            Back to team
          </Link>
        }
      />

      <form className="space-y-6" onSubmit={handleSubmit}>
        <section className="dashboard-card p-6">
          <h2 className="text-lg font-semibold">Account details</h2>
          <p className="mt-1 text-sm text-muted">
            The member will set their own password from the invitation email.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">First name</span>
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Sarah"
                required
                className="input-field"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Last name</span>
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Chen"
                required
                className="input-field"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="sarah@example.com"
                required
                className="input-field"
              />
            </label>
          </div>
        </section>

        <section className="dashboard-card p-6">
          <h2 className="text-lg font-semibold">Role</h2>
          <p className="mt-1 text-sm text-muted">
            This chooses their dashboard. They only see modules your organisation has enabled.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {REGISTERABLE_ROLES.map((option) => {
              const active = role === option.code;

              return (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => setRole(option.code)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    active
                      ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                      : "border-border bg-background hover:border-primary/20"
                  }`}
                >
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${option.tint}`}
                  >
                    {option.label}
                  </span>
                  <p className="mt-3 text-sm leading-6 text-muted">{option.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {errorMessage ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-70"
          >
            {isLoading ? "Sending invite…" : "Send invite"}
          </button>
          <Link
            href="/org-admin/team"
            className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-muted transition hover:border-primary/30 hover:text-foreground"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
