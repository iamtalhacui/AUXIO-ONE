import Image from "next/image";
import { ShieldCheck, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { hero, stats, trustBadges } from "@/lib/content";
import { landingImages } from "@/lib/landing-images";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-28">
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-pulse-soft" />
      <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl animate-float" />

      <div className="section-shell relative grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="animate-fade-in-up">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {hero.eyebrow}
          </p>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            <span className="text-gradient">{hero.title}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted sm:text-xl">
            {hero.subtitle}
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Button href="/get-started">{hero.primaryCta}</Button>
            <Button href="#how-it-works" variant="secondary">
              {hero.secondaryCta}
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {trustBadges.map((badge) => (
              <div key={badge} className="flex items-center gap-2 text-sm text-muted">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {badge}
              </div>
            ))}
          </div>
        </div>

        <div className="relative animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          <div className="relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] border border-border/60 shadow-2xl shadow-primary/10 lg:ml-auto">
            <Image
              src={landingImages.hero}
              alt={hero.imageAlt}
              fill
              priority
              sizes="(min-width: 1024px) 420px, 90vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>

          <div
            className="card-surface absolute -left-6 top-10 flex items-center gap-3 px-4 py-3 animate-float shadow-xl sm:-left-10"
            style={{ animationDelay: "0.5s" }}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">Compliance verified</p>
              <p className="text-xs text-muted">Auto-tracked expiry dates</p>
            </div>
          </div>

          <div
            className="card-surface absolute -right-4 bottom-10 flex items-center gap-3 px-4 py-3 animate-float-delayed shadow-xl sm:-right-8"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">Shift in progress</p>
              <p className="text-xs text-muted">Clocked in · on schedule</p>
            </div>
          </div>
        </div>
      </div>

      <div className="section-shell relative">
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="card-surface p-5 animate-fade-in-up"
              style={{ animationDelay: `${200 + index * 100}ms` }}
            >
              <p className="text-3xl font-semibold text-primary">{stat.value}</p>
              <p className="mt-2 text-sm text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
