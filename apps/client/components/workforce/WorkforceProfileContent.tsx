"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  useGetMyWorkforceProfileQuery,
  useUpdateMyWorkforceProfileMutation,
} from "@/lib/api/api";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { AU_STATES } from "@/lib/onboarding/constants";
import { inputClass, labelClass } from "@/lib/onboarding/form-styles";
import { updateUser } from "@/lib/features/auth/authSlice";
import { useAppDispatch } from "@/lib/store/hooks";

const GENDER_OPTIONS = ["Female", "Male", "Non-binary", "Prefer not to say", "Other"];

export function WorkforceProfileContent() {
  const dispatch = useAppDispatch();
  const { data, isLoading, error } = useGetMyWorkforceProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateMyWorkforceProfileMutation();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    suburb: "",
    state: "",
    postcode: "",
    preferredName: "",
    dateOfBirth: "",
    gender: "",
    languages: "",
    bio: "",
  });
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name,
      phone: data.phone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      suburb: data.suburb,
      state: data.state,
      postcode: data.postcode,
      preferredName: data.preferredName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      languages: data.languages,
      bio: data.bio,
    });
  }, [data]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaveError("");
    setSuccess("");

    try {
      const result = await updateProfile(form).unwrap();
      dispatch(
        updateUser({
          id: result.id,
          email: result.email,
          name: result.name,
          role: result.role ?? undefined,
          status: result.status,
        }),
      );
      setSuccess("Profile updated.");
    } catch (err) {
      setSaveError(getErrorMessage(err, "Could not update profile"));
    }
  }

  if (isLoading) {
    return <div className="dashboard-card p-6 text-sm text-muted">Loading profile...</div>;
  }

  if (error || !data) {
    return (
      <div className="dashboard-card p-6 text-sm text-red-700">
        {getErrorMessage(error, "Could not load profile")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your profile"
        description="View and update your contact details and personal information."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="dashboard-card p-6">
          <h2 className="text-lg font-semibold">Account</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Full name</span>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label className="block">
              <span className={labelClass}>Email</span>
              <input className={`${inputClass} bg-surface-muted text-muted`} value={data.email} readOnly />
            </label>
            <div className="block">
              <span className={labelClass}>Role</span>
              <p className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm">
                {data.roleName ?? data.role ?? "—"}
              </p>
            </div>
            <div className="block">
              <span className={labelClass}>Organisation</span>
              <p className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm">
                {data.organisationName ?? "—"}
              </p>
            </div>
          </div>
        </section>

        <section className="dashboard-card p-6">
          <h2 className="text-lg font-semibold">Contact</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className={labelClass}>Phone</span>
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label className="block md:col-span-2">
              <span className={labelClass}>Street address</span>
              <input
                className={inputClass}
                value={form.addressLine1}
                onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
              />
            </label>
            <label className="block md:col-span-2">
              <span className={labelClass}>Address line 2</span>
              <input
                className={inputClass}
                value={form.addressLine2}
                onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Suburb</span>
              <input
                className={inputClass}
                value={form.suburb}
                onChange={(e) => setForm({ ...form, suburb: e.target.value })}
              />
            </label>
            <label className="block">
              <span className={labelClass}>State</span>
              <select
                className={inputClass}
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              >
                <option value="">Select state</option>
                {AU_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Postcode</span>
              <input
                className={inputClass}
                value={form.postcode}
                onChange={(e) => setForm({ ...form, postcode: e.target.value })}
              />
            </label>
          </div>
        </section>

        <section className="dashboard-card p-6">
          <h2 className="text-lg font-semibold">Personal</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Preferred name</span>
              <input
                className={inputClass}
                value={form.preferredName}
                onChange={(e) => setForm({ ...form, preferredName: e.target.value })}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Date of birth</span>
              <input
                type="date"
                className={inputClass}
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Gender</span>
              <select
                className={inputClass}
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Languages</span>
              <input
                className={inputClass}
                value={form.languages}
                onChange={(e) => setForm({ ...form, languages: e.target.value })}
              />
            </label>
            <label className="block md:col-span-2">
              <span className={labelClass}>Bio</span>
              <textarea
                className={`${inputClass} resize-none`}
                rows={4}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </label>
          </div>
        </section>

        {saveError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            {success}
          </p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-light disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
