"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useRegisterTeamMemberMutation } from "@/lib/api/api";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import type { ConfigurableRoleCode, RegisterTeamMemberRequest } from "@/lib/api/types";
import { REGISTERABLE_ROLES } from "@/lib/dashboard/content/org-admin-team";
import { SERVICE_LINE_OPTIONS } from "@/lib/onboarding/constants";

const inputClass = "input-field";

export function RegisterTeamMemberForm() {
  const router = useRouter();
  const [registerMember, { isLoading }] = useRegisterTeamMemberMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ConfigurableRoleCode>("EMPLOYEE");
  const [serviceLine, setServiceLine] =
    useState<RegisterTeamMemberRequest["serviceLine"]>("NDIS");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const result = await registerMember({
        name,
        email,
        role,
        serviceLine,
      }).unwrap();

      setSuccess(
        result.inviteEmail?.sent
          ? `Invitation email sent to ${result.email}. Ask them to check their inbox and spam folder.`
          : `Account created for ${result.email}, but the invitation email could not be sent. Check server Gmail settings.`,
      );

      router.push("/org-admin/team");
    } catch (err) {
      setError(getErrorMessage(err, "Could not register team member"));
    }
  }

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
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium">Full name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Sarah Chen"
                required
                className={inputClass}
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
                className={inputClass}
              />
            </label>
          </div>
        </section>

        <section className="dashboard-card p-6">
          <h2 className="text-lg font-semibold">Role</h2>
          <p className="mt-1 text-sm text-muted">
            Choose what this person can access. Fine-grained permissions are configured under Roles.
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

        <section className="dashboard-card p-6">
          <h2 className="text-lg font-semibold">Service line</h2>
          <p className="mt-1 text-sm text-muted">
            Set the worker&apos;s service line. This determines their compliance checklist and cannot be chosen by the worker.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {SERVICE_LINE_OPTIONS.map((option) => {
              const active = serviceLine === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setServiceLine(option.value)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    active
                      ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                      : "border-border bg-background hover:border-primary/20"
                  }`}
                >
                  <p className="font-semibold">{option.label}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{option.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-primary">
            {success}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send Invite"}
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
