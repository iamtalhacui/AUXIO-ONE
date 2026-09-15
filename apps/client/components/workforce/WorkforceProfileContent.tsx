"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { inputClass, labelClass } from "@/lib/onboarding/form-styles";
import { useGetOnboardingMeQuery, useUpdatePersonalDetailsMutation } from "@/lib/api/authApi";
import { useAppSelector } from "@/lib/store/hooks";
import { getErrorMessage } from "@/lib/api/getErrorMessage";

type FormState = {
  preferredName: string;
  dateOfBirth: string;
  mobile: string;
  homeAddress: string;
  emergencyName: string;
  emergencyPhone: string;
};

export function WorkforceProfileContent() {
  const { data, isLoading } = useGetOnboardingMeQuery();
  const [updatePersonalDetails, { isLoading: isSaving }] = useUpdatePersonalDetailsMutation();
  const orgUser = useAppSelector((state) => state.orgAuth.user);

  const [form, setForm] = useState<FormState>({
    preferredName: "",
    dateOfBirth: "",
    mobile: "",
    homeAddress: "",
    emergencyName: "",
    emergencyPhone: "",
  });

  const [touched, setTouched] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync form state when data arrives, but only if not touched
  useEffect(() => {
    if (!touched && data?.submission?.payload?.personal) {
      const personal = data.submission.payload.personal as Record<string, string | string[] | undefined>;
      setForm({
        preferredName: (Array.isArray(personal.preferredName) ? personal.preferredName[0] : personal.preferredName) ?? "",
        dateOfBirth: (Array.isArray(personal.dateOfBirth) ? personal.dateOfBirth[0] : personal.dateOfBirth) ?? "",
        mobile: (Array.isArray(personal.mobile) ? personal.mobile[0] : personal.mobile) ?? "",
        homeAddress: (Array.isArray(personal.homeAddress) ? personal.homeAddress[0] : personal.homeAddress) ?? "",
        emergencyName: (Array.isArray(personal.emergencyName) ? personal.emergencyName[0] : personal.emergencyName) ?? "",
        emergencyPhone: (Array.isArray(personal.emergencyPhone) ? personal.emergencyPhone[0] : personal.emergencyPhone) ?? "",
      });
    }
  }, [JSON.stringify(data?.submission?.payload?.personal), touched]);

  const handleChange = (field: keyof FormState, value: string) => {
    setTouched(true);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);

    // Build request body from editable fields only
    const body: Partial<FormState> = {};
    let hasChanges = false;

    if (form.preferredName) {
      body.preferredName = form.preferredName;
      hasChanges = true;
    }
    if (form.dateOfBirth) {
      body.dateOfBirth = form.dateOfBirth;
      hasChanges = true;
    }
    if (form.mobile) {
      body.mobile = form.mobile;
      hasChanges = true;
    }
    if (form.homeAddress) {
      body.homeAddress = form.homeAddress;
      hasChanges = true;
    }
    if (form.emergencyName) {
      body.emergencyName = form.emergencyName;
      hasChanges = true;
    }
    if (form.emergencyPhone) {
      body.emergencyPhone = form.emergencyPhone;
      hasChanges = true;
    }

    if (!hasChanges) {
      setMessage({ type: "error", text: "Please fill in at least one field" });
      return;
    }

    try {
      const result = await updatePersonalDetails(body).unwrap();
      const saved = result?.submission?.payload?.personal as
        Record<string, string | string[] | undefined> | undefined;
      if (saved) {
        const pick = (v: string | string[] | undefined) =>
          (Array.isArray(v) ? v[0] : v) ?? "";
        setForm({
          preferredName: pick(saved.preferredName),
          dateOfBirth: pick(saved.dateOfBirth),
          mobile: pick(saved.mobile),
          homeAddress: pick(saved.homeAddress),
          emergencyName: pick(saved.emergencyName),
          emergencyPhone: pick(saved.emergencyPhone),
        });
      }
      setMessage({ type: "success", text: "Profile updated" });
      setTouched(false);
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error) });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Your profile"
          description="View and update your contact details and personal information."
        />
        <section className="dashboard-card p-6">
          <p className="text-muted">Loading your profile...</p>
        </section>
      </div>
    );
  }

  if (data?.onboardingStatus !== "VERIFIED") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Your profile"
          description="View and update your contact details and personal information."
        />
        <section className="dashboard-card p-6">
          <p className="text-muted">
            Profile editing becomes available once your onboarding has been verified by an administrator.
          </p>
        </section>
      </div>
    );
  }

  const personal = data?.submission?.payload?.personal as Record<string, string | string[] | undefined> ?? {};
  const firstName = (Array.isArray(personal.firstName) ? personal.firstName[0] : personal.firstName) ?? "";
  const lastName = (Array.isArray(personal.lastName) ? personal.lastName[0] : personal.lastName) ?? "";
  const email = (Array.isArray(personal.email) ? personal.email[0] : personal.email) ?? "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your profile"
        description="View and update your contact details and personal information."
      />

      {message && (
        <div
          className={`rounded-xl p-4 ${
            message.type === "success"
              ? "bg-success-light text-success"
              : "bg-error-light text-error"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Section */}
        <section className="dashboard-card p-6">
          <h2 className="text-lg font-semibold">Account</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className={labelClass}>First name</span>
              <input
                className={`${inputClass} bg-surface-muted text-muted`}
                value={firstName}
                disabled
              />
            </label>
            <label className="block">
              <span className={labelClass}>Last name</span>
              <input
                className={`${inputClass} bg-surface-muted text-muted`}
                value={lastName}
                disabled
              />
            </label>
            <label className="block">
              <span className={labelClass}>Email</span>
              <input
                className={`${inputClass} bg-surface-muted text-muted`}
                value={email}
                disabled
              />
            </label>
            <label className="block">
              <span className={labelClass}>Role</span>
              <input
                className={`${inputClass} bg-surface-muted text-muted`}
                value={orgUser?.role ?? ""}
                disabled
              />
            </label>
          </div>
          <p className="mt-4 text-sm text-muted">
            Your email and role are managed by your administrator and cannot be changed here.
          </p>
        </section>

        {/* Contact Section */}
        <section className="dashboard-card p-6">
          <h2 className="text-lg font-semibold">Contact</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Mobile</span>
              <input
                type="tel"
                className={inputClass}
                value={form.mobile}
                onChange={(e) => handleChange("mobile", e.target.value)}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Home address</span>
              <input
                type="text"
                className={inputClass}
                value={form.homeAddress}
                onChange={(e) => handleChange("homeAddress", e.target.value)}
              />
            </label>
          </div>
        </section>

        {/* Personal Section */}
        <section className="dashboard-card p-6">
          <h2 className="text-lg font-semibold">Personal</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Preferred name</span>
              <input
                type="text"
                className={inputClass}
                value={form.preferredName}
                onChange={(e) => handleChange("preferredName", e.target.value)}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Date of birth</span>
              <input
                type="date"
                className={inputClass}
                value={form.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
              />
            </label>
          </div>
        </section>

        {/* Emergency Contact Section */}
        <section className="dashboard-card p-6">
          <h2 className="text-lg font-semibold">Emergency contact</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Emergency contact name</span>
              <input
                type="text"
                className={inputClass}
                value={form.emergencyName}
                onChange={(e) => handleChange("emergencyName", e.target.value)}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Emergency contact phone</span>
              <input
                type="tel"
                className={inputClass}
                value={form.emergencyPhone}
                onChange={(e) => handleChange("emergencyPhone", e.target.value)}
              />
            </label>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
