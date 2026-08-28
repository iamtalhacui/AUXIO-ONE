import { Button } from "@/components/ui/Button";
import { hero, stats } from "@/lib/content";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-28">
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-pulse-soft" />
      <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl animate-float" />

      <div className="section-shell relative">
        <div className="max-w-4xl animate-fade-in-up">
          <p className="mb-5 inline-flex rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {hero.eyebrow}
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            One platform for{" "}
            <span className="text-gradient">compliant care delivery.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
            {hero.subtitle}
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Button href="/get-started">{hero.primaryCta}</Button>
            <Button href="#platform" variant="secondary">
              {hero.secondaryCta}
            </Button>
          </div>
        </div>

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
