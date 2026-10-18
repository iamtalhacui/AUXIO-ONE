"use client";

import { FormEvent, useMemo, useState } from "react";
import { FadeIn } from "@/components/ui/FadeIn";
import { ConstrainedDateInput } from "@/components/ui/ConstrainedDateInput";
import { getStarted, site } from "@/lib/content";
import { getErrorMessage } from "@/lib/api/getErrorMessage";

const TIME_SLOTS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
] as const;

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";

type FormState = {
  organisationName: string;
  contactName: string;
  email: string;
  phone: string;
  numberOfUsers: string;
  preferredDate: string;
  preferredTime: string;
  message: string;
};

const initialForm: FormState = {
  organisationName: "",
  contactName: "",
  email: "",
  phone: "",
  numberOfUsers: "",
  preferredDate: "",
  preferredTime: "",
  message: "",
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.preferredTime) {
      setError("Please select a preferred time slot.");
      return;
    }

    setSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:4000";
      const response = await fetch(`${baseUrl}/demos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisationName: form.organisationName.trim(),
          contactName: form.contactName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          numberOfUsers: form.numberOfUsers
            ? Number(form.numberOfUsers)
            : undefined,
          preferredDate: form.preferredDate,
          preferredTime: form.preferredTime,
          message: form.message.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          typeof data?.message === "string"
            ? data.message
            : Array.isArray(data?.message)
              ? data.message.join(", ")
              : "Could not submit your demo request.",
        );
      }

      setSuccess(true);
      setForm(initialForm);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : getErrorMessage(err, "Could not submit your demo request."),
      );
    } finally {
      setSubmitting(false);
    }
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
                "30-minute live walkthrough tailored to your workflows.",
                "No obligation — just a clear look at how AUXIO One fits.",
                "We’ll confirm your preferred time by email.",
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

            {success ? (
              <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                Thanks — your demo request is in. We’ll email you shortly to confirm.
              </div>
            ) : null}

            {error ? (
              <p className="mt-6 text-sm text-red-600">{error}</p>
            ) : null}

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <label className="block sm:col-span-1">
                <span className="mb-2 block text-sm font-medium">Organisation / company name</span>
                <input
                  required
                  value={form.organisationName}
                  onChange={(e) => update("organisationName", e.target.value)}
                  placeholder="Demo Care Services Pty Ltd"
                  className={inputClass}
                />
              </label>

              <label className="block sm:col-span-1">
                <span className="mb-2 block text-sm font-medium">Contact person name</span>
                <input
                  required
                  value={form.contactName}
                  onChange={(e) => update("contactName", e.target.value)}
                  placeholder="Jane Smith"
                  className={inputClass}
                />
              </label>

              <label className="block sm:col-span-1">
                <span className="mb-2 block text-sm font-medium">Contact email</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="jane@demo-provider.com.au"
                  className={inputClass}
                />
              </label>

              <label className="block sm:col-span-1">
                <span className="mb-2 block text-sm font-medium">Phone number (optional)</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+61 400 000 000"
                  className={inputClass}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium">
                  Number of users / employees (optional)
                </span>
                <input
                  type="number"
                  min={1}
                  value={form.numberOfUsers}
                  onChange={(e) => update("numberOfUsers", e.target.value)}
                  placeholder="e.g. 25"
                  className={inputClass}
                />
              </label>

              <label className="block min-w-0 sm:col-span-2">
                <span className="mb-2 block text-sm font-medium">Preferred demo date</span>
                <ConstrainedDateInput
                  aria-label="Preferred demo date"
                  value={form.preferredDate}
                  min={minDate}
                  onChange={(next) => update("preferredDate", next)}
                />
              </label>

              <div className="sm:col-span-2">
                <span className="mb-2 block text-sm font-medium">Preferred time slot</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {TIME_SLOTS.map((slot) => {
                    const selected = form.preferredTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => update("preferredTime", slot)}
                        className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                          selected
                            ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                            : "border-border bg-background text-foreground hover:border-primary/40"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium">
                  Additional message / requirements (optional)
                </span>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder="Service lines, team size, modules you're interested in..."
                  className={inputClass}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-8 inline-flex w-full items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-light disabled:opacity-60 sm:w-auto"
            >
              {submitting ? "Submitting…" : "Book a Demo"}
            </button>
          </form>
        </FadeIn>
      </div>
    </section>
  );
}
