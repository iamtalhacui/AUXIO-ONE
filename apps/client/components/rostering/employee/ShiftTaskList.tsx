"use client";

import type { ShiftTask } from "@/lib/api/types";
import { formatClock } from "@/lib/rostering/format";

type Props = {
  tasks: ShiftTask[];
  /** Tasks only become interactive once the shift is IN_PROGRESS. */
  interactive: boolean;
  busyTaskId?: string | null;
  disabled?: boolean;
  onComplete?: (taskId: string) => void;
};

export function ShiftTaskList({
  tasks,
  interactive,
  busyTaskId,
  disabled = false,
  onComplete,
}: Props) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.completedAt).length;
  const requiredRemaining = tasks.filter((t) => t.required && !t.completedAt).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <section className="dashboard-card overflow-hidden">
      <div className="border-b border-border/50 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">Tasks</h2>
          <p className="text-sm font-semibold tabular-nums text-muted">
            {done}/{total}
          </p>
        </div>
        <p className="mt-0.5 text-sm text-muted">
          {interactive
            ? requiredRemaining > 0
              ? `${requiredRemaining} required task${
                  requiredRemaining === 1 ? "" : "s"
                } left before you can finish`
              : "All required tasks are done."
            : "What you will be doing on this shift. You can tick these off once you start."}
        </p>

        {total > 0 ? (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        ) : null}
      </div>

      {total === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted">
          No tasks were attached to this shift.
        </p>
      ) : (
        <ul className="divide-y divide-border/40">
          {tasks.map((task) => {
            const complete = Boolean(task.completedAt);
            return (
              <li
                key={task.id}
                className={`flex items-start gap-3 px-5 py-3.5 ${
                  complete ? "bg-emerald-50/40" : ""
                }`}
              >
                <button
                  type="button"
                  aria-label={complete ? "Completed" : `Mark "${task.label}" done`}
                  disabled={!interactive || complete || disabled}
                  onClick={() => onComplete?.(task.id)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                    complete
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : interactive
                        ? "border-border bg-surface hover:border-primary hover:bg-primary/5 disabled:opacity-40"
                        : "border-border/60 bg-surface-muted"
                  }`}
                >
                  {complete ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3.5 w-3.5">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  ) : busyTaskId === task.id ? (
                    <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  ) : null}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      complete ? "text-muted line-through" : "text-foreground"
                    }`}
                  >
                    {task.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {complete
                      ? `Done at ${formatClock(task.completedAt as string)}`
                      : task.required
                        ? "Required"
                        : "Optional"}
                  </p>
                </div>

                {!complete && task.required ? (
                  <span className="status-pill bg-amber-50 text-amber-800 !px-2 !py-0.5 !text-[11px]">
                    Required
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
