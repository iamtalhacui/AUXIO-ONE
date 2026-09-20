"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export type ToastOptions = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** ms before auto-dismiss. Set to 0 to require manual dismissal. */
  duration?: number;
};

type ToastEntry = ToastOptions & { id: string; leaving?: boolean };

type ToastContextValue = {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; iconClass: string; barClass: string }
> = {
  success: { icon: CheckCircle2, iconClass: "text-emerald-600", barClass: "bg-emerald-500" },
  error: { icon: XCircle, iconClass: "text-red-600", barClass: "bg-red-500" },
  warning: { icon: AlertTriangle, iconClass: "text-amber-600", barClass: "bg-amber-500" },
  info: { icon: Info, iconClass: "text-primary", barClass: "bg-primary" },
};

const DEFAULT_DURATION = 5000;
const EXIT_ANIMATION_MS = 220;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    timers.current.delete(id);
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      const existing = timers.current.get(id);
      if (existing) clearTimeout(existing);
      setTimeout(() => remove(id), EXIT_ANIMATION_MS);
    },
    [remove],
  );

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const entry: ToastEntry = { variant: "info", duration: DEFAULT_DURATION, ...options, id };
      setToasts((prev) => [...prev, entry]);

      if (entry.duration && entry.duration > 0) {
        const timer = setTimeout(() => dismiss(id), entry.duration);
        timers.current.set(id, timer);
      }
      return id;
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-end gap-2.5 p-4 sm:p-6"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => {
          const variant = t.variant ?? "info";
          const { icon: Icon, iconClass, barClass } = VARIANT_STYLES[variant];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl border border-border bg-surface shadow-xl transition-all duration-200 ease-out ${
                t.leaving
                  ? "translate-x-4 opacity-0"
                  : "animate-toast-in translate-x-0 opacity-100"
              }`}
            >
              <span className={`absolute inset-y-0 left-0 w-1 ${barClass}`} aria-hidden />
              <div className="flex items-start gap-3 px-4 py-3.5 pl-5">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{t.title}</p>
                  {t.description ? (
                    <p className="mt-0.5 text-sm leading-snug text-muted">{t.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 rounded-md p-1 text-muted transition hover:bg-surface-muted hover:text-foreground"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
