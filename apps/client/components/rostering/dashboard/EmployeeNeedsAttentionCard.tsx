"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useAcceptShiftOfferMutation,
  useDeclineShiftOfferMutation,
} from "@/lib/api/authApi";
import { getErrorMessage } from "@/lib/api/getErrorMessage";
import { useToast } from "@/components/toast/ToastProvider";
import type { EmployeeOverview } from "@/lib/api/types";
import { formatLongDate, formatShiftTime } from "@/lib/rostering/format";

type EmployeeNeedsAttentionCardProps = {
  attention: EmployeeOverview["attention"];
  scheduleEnabled: boolean;
  serviceDeliveryEnabled: boolean;
};

type ShiftItem = EmployeeOverview["attention"]["offers"][number];

function OfferRow({ item }: { item: ShiftItem }) {
  const { toast } = useToast();
  const [accept, acceptState] = useAcceptShiftOfferMutation();
  const [decline, declineState] = useDeclineShiftOfferMutation();
  const [localError, setLocalError] = useState("");
  const busy = acceptState.isLoading || declineState.isLoading;

  async function run(action: "accept" | "decline") {
    setLocalError("");
    try {
      if (action === "accept") await accept(item.shiftId).unwrap();
      else await decline(item.shiftId).unwrap();
      toast({
        variant: "success",
        title: action === "accept" ? "Offer accepted" : "Offer declined",
      });
    } catch (err) {
      const message = getErrorMessage(err, "Could not update offer");
      setLocalError(message);
      toast({ variant: "error", title: "Could not update offer", description: message });
    }
  }

  return (
    <li className="rounded-xl border border-sky-200 bg-sky-50/40 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{item.participantName}</p>
          <p className="mt-0.5 text-xs text-muted">
            {formatLongDate(item.date)} · {formatShiftTime(item.startTime, item.endTime)}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted">
            {item.locationLabel} · {item.serviceTitle}
          </p>
          {localError ? <p className="mt-2 text-xs text-red-600">{localError}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary text-xs"
            disabled={busy}
            onClick={() => void run("decline")}
          >
            Decline
          </button>
          <button
            type="button"
            className="btn-primary text-xs"
            disabled={busy}
            onClick={() => void run("accept")}
          >
            Accept
          </button>
        </div>
      </div>
    </li>
  );
}

function ActionRow({
  item,
  cta,
  href,
}: {
  item: ShiftItem;
  cta: string;
  href: string;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{item.participantName}</p>
        <p className="truncate text-xs text-muted">
          {formatLongDate(item.date)} · {formatShiftTime(item.startTime, item.endTime)} ·{" "}
          {item.serviceTitle}
        </p>
      </div>
      <Link href={href} className="btn-secondary shrink-0 text-xs">
        {cta}
      </Link>
    </li>
  );
}

export function EmployeeNeedsAttentionCard({
  attention,
  scheduleEnabled,
  serviceDeliveryEnabled,
}: EmployeeNeedsAttentionCardProps) {
  if (!scheduleEnabled) {
    return (
      <div className="dashboard-card overflow-hidden">
        <div className="border-b border-border/70 px-6 py-5">
          <h2 className="text-lg font-semibold">Needs attention</h2>
          <p className="text-sm text-muted">Schedule module not enabled</p>
        </div>
        <p className="px-6 py-10 text-center text-sm text-muted">
          Ask your Org Admin to enable the Schedule module.
        </p>
      </div>
    );
  }

  const readyToStart = serviceDeliveryEnabled ? attention.readyToStartToday : [];
  const total =
    attention.offers.length + attention.inProgress.length + readyToStart.length;

  const showNext =
    total === 0 && attention.nextShift != null && attention.nextShift.status !== "IN_PROGRESS";

  return (
    <div className="dashboard-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/70 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold">Needs attention</h2>
          <p className="text-sm text-muted">
            {total === 0
              ? showNext
                ? "Your next shift is lined up"
                : "Nothing waiting on you right now"
              : `${total} item${total === 1 ? "" : "s"} need you`}
          </p>
        </div>
        <Link href="/my-shifts" className="text-sm font-semibold text-primary">
          All shifts
        </Link>
      </div>

      {total === 0 && !showNext ? (
        <p className="px-6 py-10 text-center text-sm text-muted">You&apos;re caught up.</p>
      ) : (
        <div className="divide-y divide-border/60">
          {attention.offers.length > 0 ? (
            <div className="px-6 py-4">
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-sm font-semibold">Shift offers</h3>
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">
                  {attention.offers.length}
                </span>
              </div>
              <ul className="space-y-3">
                {attention.offers.map((item) => (
                  <OfferRow key={item.shiftId} item={item} />
                ))}
              </ul>
            </div>
          ) : null}

          {attention.inProgress.length > 0 ? (
            <div className="px-6 py-4">
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-sm font-semibold">In progress</h3>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  {attention.inProgress.length}
                </span>
              </div>
              <ul className="space-y-3">
                {attention.inProgress.map((item) => (
                  <ActionRow
                    key={item.shiftId}
                    item={item}
                    cta="Continue"
                    href={`/my-shifts/${item.shiftId}`}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          {readyToStart.length > 0 ? (
            <div className="px-6 py-4">
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-sm font-semibold">Ready to start today</h3>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  {readyToStart.length}
                </span>
              </div>
              <ul className="space-y-3">
                {readyToStart.map((item) => (
                  <ActionRow
                    key={item.shiftId}
                    item={item}
                    cta="Open"
                    href={`/my-shifts/${item.shiftId}`}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          {showNext && attention.nextShift ? (
            <div className="px-6 py-4">
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-sm font-semibold">Next shift</h3>
              </div>
              <ul className="space-y-3">
                <ActionRow
                  item={attention.nextShift}
                  cta="View"
                  href={`/my-shifts/${attention.nextShift.shiftId}`}
                />
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
