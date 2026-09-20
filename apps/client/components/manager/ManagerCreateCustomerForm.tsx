"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useCreateCustomerMutation } from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { useToast } from "@/components/toast/ToastProvider";

export function ManagerCreateCustomerForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [createCustomer, { isLoading, error, reset }] = useCreateCustomerMutation();
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [serviceLine, setServiceLine] = useState("");
  const [planStartDate, setPlanStartDate] = useState("");
  const [planEndDate, setPlanEndDate] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    reset();
    try {
      const customer = await createCustomer({
        firstName,
        middleName: middleName || undefined,
        preferredName: preferredName || undefined,
        surname,
        email: email || undefined,
        phone: phone || undefined,
        dateOfBirth: dateOfBirth || undefined,
        address: address || undefined,
        serviceLine: serviceLine || undefined,
        planStartDate: planStartDate || undefined,
        planEndDate: planEndDate || undefined,
      }).unwrap();
      toast({ variant: "success", title: "Customer registered", description: `${firstName} ${surname} was created.` });
      router.replace(`/manager/customers/${customer.id}`);
    } catch (err) {
      toast({ variant: "error", title: "Could not create customer", description: getErrorMessage(err, "Could not create customer") });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Register customer"
        description="Creates the master record and starts document onboarding."
        action={
          <Link href="/manager/customers" className="btn-secondary">
            Back to list
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="dashboard-card max-w-3xl space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="input-label">First name *</span>
            <input className="input-field" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </label>
          <label className="block">
            <span className="input-label">Surname *</span>
            <input className="input-field" value={surname} onChange={(e) => setSurname(e.target.value)} required />
          </label>
          <label className="block">
            <span className="input-label">Middle name</span>
            <input className="input-field" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
          </label>
          <label className="block">
            <span className="input-label">Preferred name</span>
            <input className="input-field" value={preferredName} onChange={(e) => setPreferredName(e.target.value)} />
          </label>
          <label className="block">
            <span className="input-label">Email</span>
            <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block">
            <span className="input-label">Phone</span>
            <input className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="block">
            <span className="input-label">Date of birth</span>
            <input type="date" className="input-field" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          </label>
          <label className="block">
            <span className="input-label">Service line</span>
            <input
              className="input-field"
              value={serviceLine}
              onChange={(e) => setServiceLine(e.target.value)}
              placeholder="e.g. NDIS, Aged Care"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="input-label">Address</span>
            <input className="input-field" value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>
          <label className="block">
            <span className="input-label">Plan start</span>
            <input type="date" className="input-field" value={planStartDate} onChange={(e) => setPlanStartDate(e.target.value)} />
          </label>
          <label className="block">
            <span className="input-label">Plan end</span>
            <input type="date" className="input-field" value={planEndDate} onChange={(e) => setPlanEndDate(e.target.value)} />
          </label>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getErrorMessage(error, "Could not create customer")}
          </p>
        ) : null}

        <button type="submit" disabled={isLoading} className="btn-primary disabled:opacity-70">
          {isLoading ? "Saving…" : "Create customer"}
        </button>
      </form>
    </div>
  );
}
