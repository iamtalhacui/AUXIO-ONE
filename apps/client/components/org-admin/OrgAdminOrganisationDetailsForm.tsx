"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  useDeleteOrganisationLogoMutation,
  useGetOrganisationQuery,
  useUpdateOrganisationMutation,
  useUploadOrganisationLogoMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { setOrganisation } from "@/lib/store/orgAuthSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";

const timeZones = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Australia/Adelaide",
];

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const DEFAULT_BRAND = "#0f766e";

export function OrgAdminOrganisationDetailsForm() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.orgAuth.accessToken);
  const { data: org, isLoading, error } = useGetOrganisationQuery();
  const [updateOrganisation, { isLoading: isSaving }] = useUpdateOrganisationMutation();
  const [uploadLogo, { isLoading: isUploading }] = useUploadOrganisationLogoMutation();
  const [deleteLogo, { isLoading: isDeleting }] = useDeleteOrganisationLogoMutation();

  const [legalName, setLegalName] = useState("");
  const [tradingName, setTradingName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [timeZone, setTimeZone] = useState(timeZones[0]);
  const [tagline, setTagline] = useState("");
  const [brandColor, setBrandColor] = useState(DEFAULT_BRAND);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!org) return;
    setLegalName(org.name);
    setTradingName(org.tradingName ?? "");
    setContactEmail(org.email);
    setContactPhone(org.phone ?? "");
    setTimeZone(org.timezone);
    setTagline(org.tagline ?? "");
    setBrandColor(org.brandColor || DEFAULT_BRAND);
    setPendingLogo(null);
    setRemoveLogo(false);
  }, [org]);

  useEffect(() => {
    if (!org?.hasLogo || !accessToken || pendingLogo || removeLogo) {
      if (!pendingLogo) setLogoPreview(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    const base = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:4000";

    (async () => {
      try {
        const res = await fetch(`${base}/organisation/logo`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) return;
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setLogoPreview(objectUrl);
      } catch {
        // keep placeholder
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [org?.hasLogo, accessToken, pendingLogo, removeLogo]);

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_LOGO_BYTES) {
      setFormError("Logo must be 2 MB or smaller.");
      return;
    }

    setFormError("");
    setRemoveLogo(false);
    setPendingLogo(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSuccess("");

    try {
      let latest = await updateOrganisation({
        name: legalName.trim(),
        tradingName: tradingName.trim() || undefined,
        tagline: tagline.trim() || undefined,
        email: contactEmail.trim(),
        phone: contactPhone.trim() || undefined,
        timezone: timeZone,
        brandColor,
      }).unwrap();

      if (removeLogo && org?.hasLogo) {
        latest = await deleteLogo().unwrap();
      } else if (pendingLogo) {
        latest = await uploadLogo(pendingLogo).unwrap();
      }

      dispatch(setOrganisation(latest));
      setPendingLogo(null);
      setRemoveLogo(false);
      setSuccess("Organisation details saved.");
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not save organisation details."));
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted">Loading organisation…</p>;
  }

  if (error || !org) {
    return (
      <p className="text-sm text-red-600">
        {getErrorMessage(error, "Could not load organisation details.")}
      </p>
    );
  }

  const busy = isSaving || isUploading || isDeleting;
  const displayName = tradingName || legalName;

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
                {Array.from(new Set([timeZone, ...timeZones])).map((zone) => (
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
          <p className="mt-1 text-sm text-muted">
            Logo and accent colour applied to every user in this organisation.
          </p>

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
                    {displayName.slice(0, 2).toUpperCase() || "OR"}
                  </span>
                )}
              </div>
              <label className="cursor-pointer text-sm font-medium text-primary hover:text-primary-light">
                Upload logo
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" className="hidden" onChange={handleLogoChange} />
              </label>
              {(logoPreview || org.hasLogo) && !removeLogo ? (
                <button
                  type="button"
                  className="text-xs font-medium text-red-600 hover:underline"
                  onClick={() => {
                    setPendingLogo(null);
                    setRemoveLogo(true);
                    setLogoPreview(null);
                  }}
                >
                  Remove logo
                </button>
              ) : null}
              <p className="text-center text-xs text-muted">PNG, JPEG, WebP, GIF or SVG, up to 2 MB</p>
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
                    pattern="^#[0-9A-Fa-f]{6}$"
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
                  {displayName}
                </p>
                <p className="mt-1 text-sm text-muted">{tagline || "Your workspace accent colour"}</p>
              </div>
            </div>
          </div>
        </section>

        {formError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
            {success}
          </p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-light disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save organisation details"}
          </button>
        </div>
      </form>
    </>
  );
}
