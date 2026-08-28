import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type ButtonProps = ComponentProps<"a"> & {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
  href: string;
};

const variants = {
  primary:
    "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-light",
  secondary:
    "border border-border bg-surface text-foreground hover:border-primary/30 hover:bg-surface-muted",
  ghost: "text-foreground hover:text-primary",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  href,
  ...props
}: ButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition duration-300 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
