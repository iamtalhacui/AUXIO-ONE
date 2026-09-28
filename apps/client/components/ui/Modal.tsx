"use client";

import { useEffect, type ReactNode } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  footer?: ReactNode;
  children: ReactNode;
};

const SIZES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

/** Shared dialog shell: overlay, sticky header, scrollable body, sticky footer. */
export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  footer,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-xl sm:rounded-2xl ${SIZES[size]}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/50 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-sm text-muted">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 rounded-md p-1.5 text-muted transition hover:bg-surface-muted hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer ? (
          <div className="flex flex-col-reverse gap-2 border-t border-border/50 px-5 py-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
