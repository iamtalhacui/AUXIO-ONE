"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, CalendarDays, Check, Mail, UserRound } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useRegisterTeamMemberMutation } from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { useToast } from "@/components/toast/ToastProvider";
import type { WorkforceRole } from "@/lib/api/types";
import { REGISTERABLE_ROLES } from "@/lib/dashboard/content/org-admin-team";

const ROLE_ICONS = {
  MANAGER: Briefcase,
  ROSTERING_EXPERT: CalendarDays,
  EMPLOYEE: UserRound,
} as const;

// Invite a new Manager, Rostering Expert, or Employee to this organisation.
export function RegisterTeamMemberForm() {
  const { toast } = useToast();
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
      toast({
        variant: "success",
        title: "Invite sent",
        description: `${firstName} ${lastName} will receive a setup email.`,
      });
      router.replace("/org-admin/team");
    } catch (err) {
      toast({
        variant: "error",
        title: "Could not send invite",
        description: getErrorMessage(err, "Could not send invite"),
      });
    }
  }

  const errorMessage = error ? getErrorMessage(error, "Could not send invite") : null;
  const selectedRole = REGISTERABLE_ROLES.find((option) => option.code === role);

  return (
    <div className="rtm-shell">
      <PageHeader
        title="Register team member"
        description="Invite someone to your organisation. They’ll get an email to set their password and sign in."
        action={
          <Link href="/org-admin/team" className="rtm-back">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Link>
        }
      />

      <form className="rtm-panel" onSubmit={handleSubmit} noValidate>
        <section className="rtm-section">
          <header className="rtm-section-head">
            <h2 className="rtm-section-title">Account details</h2>
            <p className="rtm-section-desc">
              They’ll choose their own password from the invitation email.
            </p>
          </header>

          <div className="rtm-grid">
            <label className="rtm-field">
              <span className="input-label">First name</span>
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Sarah"
                required
                className="input-field"
                autoFocus
              />
            </label>

            <label className="rtm-field">
              <span className="input-label">Last name</span>
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Chen"
                required
                className="input-field"
              />
            </label>

            <label className="rtm-field rtm-field-full">
              <span className="input-label">Work email</span>
              <span className="rtm-input-icon">
                <Mail className="h-4 w-4 text-muted" aria-hidden />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="sarah@provider.com.au"
                  required
                  className="input-field rtm-input-with-icon"
                />
              </span>
            </label>
          </div>
        </section>

        <div className="rtm-divider" />

        <section className="rtm-section">
          <header className="rtm-section-head">
            <h2 className="rtm-section-title">Assign a role</h2>
            <p className="rtm-section-desc">
              Controls which dashboard they see. Modules still follow your organisation entitlements.
            </p>
          </header>

          <div className="rtm-role-grid" role="radiogroup" aria-label="Team member role">
            {REGISTERABLE_ROLES.map((option) => {
              const active = role === option.code;
              const Icon = ROLE_ICONS[option.code];

              return (
                <button
                  key={option.code}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setRole(option.code)}
                  className={`rtm-role-card ${active ? "rtm-role-card-active" : ""}`}
                >
                  <span className="rtm-role-top">
                    <span className={`rtm-role-icon ${active ? "rtm-role-icon-active" : ""}`}>
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="rtm-role-radio" aria-hidden>
                      {active ? <Check className="h-3 w-3" strokeWidth={2.5} /> : null}
                    </span>
                  </span>
                  <span className="rtm-role-name">{option.label}</span>
                  <span className="rtm-role-desc">{option.description}</span>
                </button>
              );
            })}
          </div>

          {selectedRole ? (
            <p className="rtm-role-summary">
              Inviting as <strong>{selectedRole.label}</strong>
              {firstName.trim() ? (
                <>
                  {" "}
                  · {firstName.trim()}
                  {lastName.trim() ? ` ${lastName.trim()}` : ""}
                </>
              ) : null}
            </p>
          ) : null}
        </section>

        {errorMessage ? <p className="rtm-banner">{errorMessage}</p> : null}

        <footer className="rtm-footer">
          <Link href="/org-admin/team" className="rtm-cancel">
            Cancel
          </Link>
          <button type="submit" disabled={isLoading} className="btn-primary disabled:opacity-70">
            {isLoading ? "Sending invite…" : "Send invite"}
          </button>
        </footer>
      </form>
    </div>
  );
}
