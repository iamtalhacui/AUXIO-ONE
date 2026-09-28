"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Camera, Pencil, Trash2 } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [logoMenuOpen, setLogoMenuOpen] = useState(false);
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

  function openFilePicker() {
    setLogoMenuOpen(false);
    fileInputRef.current?.click();
  }

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
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

  function handleRemoveLogo() {
    setLogoMenuOpen(false);
    setPendingLogo(null);
    setRemoveLogo(true);
    setLogoPreview(null);
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
      toast({
        variant: "error",
        title: "Could not save organisation details",
        description: message,
      });
    }
  }

  if (isLoading) {
    return (
      <div className="orgd-shell">
        <div className="orgd-skeleton h-10 w-64 rounded-md" />
        <div className="orgd-skeleton orgd-panel h-80" />
      </div>
    );
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
  const initials =
    displayName
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "OR";
  const hasVisibleLogo = Boolean(logoPreview) && !removeLogo;

  return (
    <div className="orgd-shell">
      <PageHeader
        title="Organisation details"
        description="Identity and contact info shown across your workspace."
      />

      <form className="orgd-panel" onSubmit={handleSubmit}>
        <div className="orgd-layout">
          {/* Brand mark — square (org logos read better as marks than circular avatars) */}
          <aside className="orgd-brand">
            <div className="orgd-logo-wrap">
              <button
                type="button"
                className="orgd-logo"
                onClick={openFilePicker}
                aria-label={hasVisibleLogo ? "Change organisation logo" : "Upload organisation logo"}
              >
                {hasVisibleLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview!} alt="" className="orgd-logo-img" />
                ) : (
                  <span className="orgd-logo-fallback">{initials}</span>
                )}
                <span className="orgd-logo-overlay" aria-hidden>
                  <Camera className="h-5 w-5" />
                  <span>{hasVisibleLogo ? "Change" : "Upload"}</span>
                </span>
              </button>

              <button
                type="button"
                className="orgd-logo-edit"
                onClick={() => setLogoMenuOpen((value) => !value)}
                aria-label="Logo options"
                aria-expanded={logoMenuOpen}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
              </button>

              {logoMenuOpen ? (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setLogoMenuOpen(false)} />
                  <div className="orgd-logo-menu" role="menu">
                    <button type="button" role="menuitem" onClick={openFilePicker} className="orgd-logo-menu-item">
                      <Camera className="h-4 w-4" aria-hidden />
                      {hasVisibleLogo ? "Replace logo" : "Upload logo"}
                    </button>
                    {hasVisibleLogo || (org.hasLogo && !removeLogo) ? (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleRemoveLogo}
                        className="orgd-logo-menu-item orgd-logo-menu-danger"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                        Remove logo
                      </button>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              className="hidden"
              onChange={handleLogoChange}
            />

            <div className="orgd-brand-meta">
              <p className="orgd-brand-name">{displayName || "Your organisation"}</p>
              <div className="orgd-chips">
                <span className="orgd-chip">{org.plan}</span>
                <span className={`orgd-chip ${org.status === "ACTIVE" ? "orgd-chip-ok" : ""}`}>
                  {org.status === "ACTIVE" ? "Active" : org.status}
                </span>
              </div>
              <p className="orgd-logo-hint">PNG, JPEG, WebP, GIF or SVG · max 2 MB</p>
            </div>
          </aside>

          <div className="orgd-fields">
            <div className="orgd-grid">
              <label className="orgd-field orgd-field-full">
                <span className="input-label">Legal name</span>
                <input
                  value={legalName}
                  onChange={(event) => setLegalName(event.target.value)}
                  required
                  className="input-field"
                />
              </label>

              <label className="orgd-field">
                <span className="input-label">Trading name</span>
                <input
                  value={tradingName}
                  onChange={(event) => setTradingName(event.target.value)}
                  placeholder="Optional"
                  className="input-field"
                />
              </label>

              <label className="orgd-field">
                <span className="input-label">Timezone</span>
                <select
                  value={timeZone}
                  onChange={(event) => setTimeZone(event.target.value)}
                  className="input-field"
                >
                  {Array.from(new Set([timeZone, ...timeZones])).map((zone) => (
                    <option key={zone} value={zone}>
                      {zone.replace("Australia/", "")}
                    </option>
                  ))}
                </select>
              </label>

              <label className="orgd-field orgd-field-full">
                <span className="input-label">Tagline</span>
                <input
                  value={tagline}
                  onChange={(event) => setTagline(event.target.value)}
                  placeholder="Short line shown in your workspace"
                  className="input-field"
                />
              </label>

              <label className="orgd-field">
                <span className="input-label">Contact email</span>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  required
                  className="input-field"
                />
              </label>

              <label className="orgd-field">
                <span className="input-label">
                  Phone <span className="font-normal text-muted">(optional)</span>
                </span>
                <input
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                  placeholder="+61 …"
                  className="input-field"
                />
              </label>
            </div>

            {formError ? <p className="orgd-error">{formError}</p> : null}
          </div>
        </div>

        <footer className="orgd-footer">
          <p className="text-xs text-muted">Changes apply for everyone in this organisation.</p>
          <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
            {busy ? "Saving…" : "Save changes"}
          </button>
        </footer>
      </form>
    </div>
  );
}
