"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { mockOrganisations } from "@/lib/mocks/data";

const timeZones = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Australia/Adelaide",
];

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const org = mockOrganisations[0];

export function OrgAdminOrganisationDetailsForm() {
  const [legalName, setLegalName] = useState(org.legalName);
  const [tradingName, setTradingName] = useState(org.tradingName ?? "");
  const [contactEmail, setContactEmail] = useState(org.contactEmail);
  const [contactPhone, setContactPhone] = useState(org.contactPhone ?? "");
  const [timeZone, setTimeZone] = useState(org.timeZone);
  const [tagline, setTagline] = useState("");
  const [brandColor, setBrandColor] = useState("#115e59");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_LOGO_BYTES) {
      setFormError("Logo must be 2 MB or smaller.");
      return;
    }

    setFormError("");
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <>
      <PageHeader title="Organisation details" description="Name, contact info, and branding." />
      <form className="space-y-6" onSubmit={handleSubmit}>
        <section className="dashboard-card p-6">
          <h2 className="text-lg font-semibold">Identity</h2>
          <p className="mt-1 text-sm text-muted">How your organisation appears across the workspace.</p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium">Legal name</span>
              <input
                value={legalName}
                onChange={(event) => setLegalName(event.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Trading name</span>
              <input
                value={tradingName}
                onChange={(event) => setTradingName(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Tagline</span>
              <input
                value={tagline}
                onChange={(event) => setTagline(event.target.value)}
                placeholder="Short description shown in your workspace"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </label>
          </div>
        </section>

        <section className="dashboard-card p-6">
          <h2 className="text-lg font-semibold">Contact</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Contact email</span>
              <input
                type="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Contact phone</span>
              <input
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium">Time zone</span>
              <select
                value={timeZone}
                onChange={(event) => setTimeZone(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              >
                {timeZones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="dashboard-card p-6">
          <h2 className="text-lg font-semibold">Branding</h2>
          <p className="mt-1 text-sm text-muted">Logo and accent colour for your organisation workspace.</p>

          <div className="mt-6 grid gap-6 lg:grid-cols-[160px_1fr]">
            <div className="flex flex-col items-center gap-3">
              <div
                className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-background"
                style={{ backgroundColor: logoPreview ? undefined : `${brandColor}14` }}
              >
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview} alt="Organisation logo preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold" style={{ color: brandColor }}>
                    {(tradingName || legalName).slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <label className="cursor-pointer text-sm font-medium text-primary hover:text-primary-light">
                Upload logo
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
              <p className="text-center text-xs text-muted">PNG or SVG, up to 2 MB</p>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Brand colour</span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(event) => setBrandColor(event.target.value)}
                    className="h-11 w-16 cursor-pointer rounded-lg border border-border bg-background"
                  />
                  <input
                    value={brandColor}
                    onChange={(event) => setBrandColor(event.target.value)}
                    className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </label>

              <div
                className="rounded-2xl border border-border p-4"
                style={{ borderColor: `${brandColor}40`, backgroundColor: `${brandColor}0d` }}
              >
                <p className="text-xs font-bold uppercase tracking-wide text-muted">Preview</p>
                <p className="mt-2 text-lg font-semibold" style={{ color: brandColor }}>
                  {tradingName || legalName}
                </p>
                <p className="mt-1 text-sm text-muted">{tagline}</p>
              </div>
            </div>
          </div>
        </section>

        {formError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-light"
          >
            Save organisation details
          </button>
        </div>
      </form>
    </>
  );
}
