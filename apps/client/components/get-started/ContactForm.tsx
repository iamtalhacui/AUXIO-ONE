"use client";

import { FormEvent, useState } from "react";
import { FadeIn } from "@/components/ui/FadeIn";
import { getStarted, site } from "@/lib/content";

const fields = [
  { id: "name", label: "Your name", placeholder: "Jane Smith", type: "text" },
  {
    id: "organisation",
    label: "Organisation name",
    placeholder: "Demo Care Services Pty Ltd",
    type: "text",
  },
  {
    id: "email",
    label: "Work email",
    placeholder: "jane@demo-provider.com.au",
    type: "email",
  },
  {
    id: "phone",
    label: "Phone (optional)",
    placeholder: "+61 400 000 000",
    type: "tel",
  },
] as const;

export function ContactForm() {
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const organisation = String(form.get("organisation") ?? "");
    const email = String(form.get("email") ?? "");
    const phone = String(form.get("phone") ?? "");
    const notes = String(form.get("message") ?? "");

    const subject = encodeURIComponent(`AUXIO One access request — ${organisation}`);
    const body = encodeURIComponent(
      [
        "Hello AUXIO One team,",
        "",
        "We would like to register our organisation on the platform.",
        "",
        `Name: ${name}`,
        `Organisation: ${organisation}`,
        `Email: ${email}`,
        `Phone: ${phone || "Not provided"}`,
        "",
        "Notes:",
        notes || "No additional notes.",
      ].join("\n"),
    );

    window.location.href = `mailto:${site.contactEmail}?subject=${subject}&body=${body}`;
  }

  return (
    <section className="pb-24">
      <div className="section-shell grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <FadeIn>
          <div className="card-surface h-fit p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              {getStarted.emailLabel}
            </p>
            <a
              href={`mailto:${site.contactEmail}`}
              className="mt-4 block text-2xl font-semibold text-primary transition hover:text-primary-light"
            >
              {site.contactEmail}
            </a>
            <p className="mt-4 text-sm leading-7 text-muted">
              {getStarted.emailNote}
            </p>

            <div className="mt-8 space-y-4 border-t border-border pt-8">
              {[
                "Organisations never self-register on the platform.",
                "Super Admin creates your tenant and first Org Admin.",
                "Module ceiling is agreed before your team gets access.",
              ].map((item) => (
                <div key={item} className="flex gap-3 text-sm leading-6 text-muted">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={100}>
          <form onSubmit={handleSubmit} className="card-surface p-8">
            <h2 className="text-2xl font-semibold">{getStarted.formTitle}</h2>
            <p className="mt-2 text-sm text-muted">{getStarted.formNote}</p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {fields.map((field) => (
                <label key={field.id} className="block sm:col-span-1">
                  <span className="mb-2 block text-sm font-medium">{field.label}</span>
                  <input
                    id={field.id}
                    name={field.id}
                    type={field.type}
                    required={field.id !== "phone"}
                    placeholder={field.placeholder}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </label>
              ))}

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium">
                  Tell us about your organisation
                </span>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Service lines, team size, modules you're interested in..."
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-light sm:w-auto"
            >
              Send request via email
            </button>
          </form>
        </FadeIn>
      </div>
    </section>
  );
}
