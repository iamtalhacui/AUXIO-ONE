import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <section>
      <header>Dashboard navigation</header>
      {children}
    </section>
  );
}
