"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginCopy } from "@/lib/content/auth";
import { useGetMaintenanceStatusQuery, useOrgLoginMutation } from "@/lib/api/authApi";
import { getErrorMessage, takeMaintenanceLogoutNotice } from "@/lib/api/getErrorMessage";
import { LIVE_POLL_MS } from "@/lib/api/liveRefresh";
import { getPostLoginPath } from "@/lib/dashboard/roles";
import { setOrgCredentials } from "@/lib/store/orgAuthSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { BrandLogo } from "@/components/ui/BrandLogo";

function formatWhen(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.orgAuth.accessToken);
  const user = useAppSelector((state) => state.orgAuth.user);
  const organisation = useAppSelector((state) => state.orgAuth.organisation);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [maintenanceNotice, setMaintenanceNotice] = useState("");
  const [login, { isLoading, error, reset }] = useOrgLoginMutation();
  const { data: maintenance } = useGetMaintenanceStatusQuery(undefined, {
    pollingInterval: LIVE_POLL_MS.lists,
  });

  useEffect(() => {
    const notice = takeMaintenanceLogoutNotice();
    if (notice) setMaintenanceNotice(notice);
  }, []);

  useEffect(() => {
    if (accessToken) router.replace(getPostLoginPath(user, organisation));
  }, [accessToken, organisation, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    reset();
    setMaintenanceNotice("");

    try {
      const result = await login({ email, password }).unwrap();
      dispatch(setOrgCredentials(result));
      router.replace(getPostLoginPath(result.user, result.organisation));
    } catch {
      // RTK error
    }
  }

  const errorMessage =
    (error ? getErrorMessage(error, "Invalid email or password") : null) ||
    maintenanceNotice ||
    null;

  const start = formatWhen(maintenance?.startsAt ?? null);
  const end = formatWhen(maintenance?.endsAt ?? null);
  const windowText =
    start && end ? `${start} → ${end}` : start ? `from ${start}` : null;

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
      <div className="w-full max-w-md">
        <div className="mb-8 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-3">
            <BrandLogo size={36} className="h-9 w-9 object-contain" />
            <span className="text-lg font-semibold">AUXIO One</span>
          </Link>
        </div>

        <p className="text-xs font-medium uppercase tracking-wide text-muted">{loginCopy.eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Sign in</h2>
        <p className="mt-2 text-sm text-muted">Use your organisation account credentials.</p>

        {maintenance?.active ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="font-semibold">Platform maintenance in progress</p>
            {windowText ? <p className="mt-1">{windowText}</p> : null}
            <p className="mt-1">
              {maintenance.message ||
                "Organisation sign-in is temporarily unavailable. Please try again later."}
            </p>
          </div>
        ) : maintenance?.upcoming ? (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-semibold">Upcoming platform maintenance</p>
            {windowText ? <p className="mt-1">{windowText}</p> : null}
            <p className="mt-1">
              {maintenance.message ||
                "Please adjust your work around this window. Sign-in may be unavailable during maintenance."}
            </p>
          </div>
        ) : null}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="input-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="input-field"
              disabled={Boolean(maintenance?.active)}
            />
          </label>
          <label className="block">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-foreground">Password</span>
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-primary hover:text-primary-light"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="input-field"
              disabled={Boolean(maintenance?.active)}
            />
          </label>
          {errorMessage ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isLoading || Boolean(maintenance?.active)}
            className="btn-primary w-full disabled:opacity-70"
          >
            {maintenance?.active
              ? "Unavailable during maintenance"
              : isLoading
                ? "Signing in…"
                : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
