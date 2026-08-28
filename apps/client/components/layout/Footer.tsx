import Link from "next/link";
import { navLinks, site } from "@/lib/content";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="section-shell grid gap-10 py-14 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-lg font-semibold">{site.name}</p>
          <p className="mt-3 max-w-md text-sm leading-7 text-muted">
            {site.description}
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Explore
            </p>
            <ul className="mt-4 space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground transition hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Contact
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/get-started"
                  className="text-sm text-foreground transition hover:text-primary"
                >
                  Register your organisation
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${site.contactEmail}`}
                  className="text-sm text-foreground transition hover:text-primary"
                >
                  {site.contactEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="section-shell flex flex-col gap-2 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p>Built for NDIS providers and care organisations in Australia.</p>
        </div>
      </div>
    </footer>
  );
}
