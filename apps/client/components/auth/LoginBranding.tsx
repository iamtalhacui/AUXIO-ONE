import Link from "next/link";
import { loginCopy } from "@/lib/content/auth";
import { roles, site } from "@/lib/content";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function LoginBranding() {
  return (
    <div className="relative hidden overflow-hidden bg-primary px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute -left-16 top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-accent/20 blur-3xl animate-float" />

      <div className="relative">
        <Link href="/" className="inline-flex items-center gap-3">
          <BrandLogo size={44} className="h-11 w-11 object-contain" />
          <span className="text-xl font-semibold">{site.name}</span>
        </Link>
      </div>

      <div className="relative max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-light">
          {loginCopy.eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">{loginCopy.title}</h1>
        <p className="mt-4 text-base leading-7 text-white/80">{loginCopy.subtitle}</p>
      </div>

      <div className="relative space-y-3">
        {roles.slice(0, 3).map((role) => (
          <div
            key={role.name}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
          >
            <p className="text-sm font-semibold">{role.name}</p>
            <p className="mt-1 text-xs text-white/70">{role.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
