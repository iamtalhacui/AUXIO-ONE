import { getStarted } from "@/lib/content";

export function ContactHero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-12 sm:pt-32">
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute right-0 top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-pulse-soft" />

      <div className="section-shell relative max-w-3xl animate-fade-in-up">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-accent">
          {getStarted.eyebrow}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {getStarted.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-muted">{getStarted.subtitle}</p>
      </div>
    </section>
  );
}
