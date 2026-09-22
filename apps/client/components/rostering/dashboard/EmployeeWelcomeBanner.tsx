"use client";

import Link from "next/link";
import { useAppSelector } from "@/lib/store/hooks";
import type { EmployeeOverview } from "@/lib/api/types";
import { formatLongDate } from "@/lib/rostering/format";

type EmployeeWelcomeBannerProps = {
  organisation: EmployeeOverview["organisation"];
  today: string;
  nextShift: EmployeeOverview["attention"]["nextShift"];
  serviceDeliveryEnabled: boolean;
};

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function EmployeeWelcomeBanner({
  organisation,
  today,
  nextShift,
  serviceDeliveryEnabled,
}: EmployeeWelcomeBannerProps) {
  const user = useAppSelector((state) => state.orgAuth.user);
  const greeting = greetingForHour(new Date().getHours());
  const name = user ? `${user.firstName} ${user.lastName}` : "Employee";

  const continueShift =
    serviceDeliveryEnabled && nextShift?.status === "IN_PROGRESS"
      ? nextShift
      : null;

  return (
    <div className="dashboard-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{greeting}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{name}</h1>
          <p className="mt-2 max-w-lg text-sm text-muted">
            {organisation.name} · {formatLongDate(today)} — offers, today&apos;s work, and your week.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {continueShift ? (
          <Link
            href={`/employee/shifts/${continueShift.shiftId}`}
            className="btn-primary"
          >
            Continue shift
          </Link>
        ) : null}
        <Link
          href="/employee/shifts"
          className={continueShift ? "btn-secondary" : "btn-primary"}
        >
          My shifts
        </Link>
        <Link href="/employee/availability" className="btn-secondary">
          Availability
        </Link>
        <Link href="/employee/profile" className="btn-secondary">
          Your profile
        </Link>
      </div>
    </div>
  );
}
