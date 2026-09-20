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
import { useToast } from "@/components/toast/ToastProvider";
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

export function OrgAdminOrganisationDetailsForm() {
  const { toast } = useToast();
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
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!org) return;
    setLegalName(org.name);
    setTradingName(org.tradingName ?? "");
    setContactEmail(org.email);
    setContactPhone(org.phone ?? "");
    setTimeZone(org.timezone);
    setTagline(org.tagline ?? "");
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

    try {
      let latest = await updateOrganisation({
        name: legalName.trim(),
        tradingName: tradingName.trim() || undefined,
        tagline: tagline.trim() || undefined,
        email: contactEmail.trim(),
        phone: contactPhone.trim() || undefined,
        timezone: timeZone,
      }).unwrap();

      if (removeLogo && org?.hasLogo) {
        latest = await deleteLogo().unwrap();
      } else if (pendingLogo) {
        latest = await uploadLogo(pendingLogo).unwrap();
      }

      dispatch(setOrganisation(latest));
      setPendingLogo(null);
      setRemoveLogo(false);
      toast({ variant: "success", title: "Organisation details saved" });
    } catch (err) {
      const message = getErrorMessage(err, "Could not save organisation details.");
      setFormError(message);
      toast({ variant: "error", title: "Could not save organisation details", description: message });
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
      <PageHeader title="Organisation details" description="Name, contact info, and logo." />
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
          <h2 className="text-lg font-semibold">Logo</h2>
          <p className="mt-1 text-sm text-muted">
            Shown in the sidebar for everyone in your organisation.
          </p>

          <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-primary/5">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="Organisation logo preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-primary">
                  {displayName.slice(0, 2).toUpperCase() || "OR"}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <label className="cursor-pointer text-sm font-medium text-primary hover:text-primary-light">
                Upload logo
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" className="hidden" onChange={handleLogoChange} />
              </label>
              {(logoPreview || org.hasLogo) && !removeLogo ? (
                <button
                  type="button"
                  className="block text-xs font-medium text-red-600 hover:underline"
                  onClick={() => {
                    setPendingLogo(null);
                    setRemoveLogo(true);
                    setLogoPreview(null);
                  }}
                >
                  Remove logo
                </button>
              ) : null}
              <p className="text-xs text-muted">PNG, JPEG, WebP, GIF or SVG, up to 2 MB</p>
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
