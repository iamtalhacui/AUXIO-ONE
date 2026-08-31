"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useRegisterTeamMemberMutation } from "@/lib/api/api";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import type { ConfigurableRoleCode } from "@/lib/api/types";
import { REGISTERABLE_ROLES } from "@/lib/dashboard/content/org-admin-team";

const inputClass = "input-field";

export function RegisterTeamMemberForm() {
  const router = useRouter();
  const [registerMember, { isLoading }] = useRegisterTeamMemberMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [role, setRole] = useState<ConfigurableRoleCode>("EMPLOYEE");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const result = await registerMember({
        name,
        email,
        password,
        role,
      }).unwrap();

      setSuccess(
        `${result.name} (${result.role.name}) registered as ${result.status}. Credential email is being sent to ${result.email}.`,
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
        description="Create an account for a manager, rostering expert, or employee. Share the email and password securely — they will use these to sign in."
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
            The member signs in with this email and password. Profile and documents are completed on first login.
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

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 8 characters"
                required
                minLength={8}
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Confirm password</span>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                required
                minLength={8}
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
