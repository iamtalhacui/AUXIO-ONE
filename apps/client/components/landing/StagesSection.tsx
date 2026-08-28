import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { stages } from "@/lib/content";

export function StagesSection() {
  return (
    <section id="platform" className="py-20 sm:py-28">
      <div className="section-shell">
        <FadeIn>
          <SectionHeading
            eyebrow="How it fits together"
            title="Four stages. One operational spine."
            description="Everything in setup and onboarding exists to make delivery compliant. Reporting follows the work — not the other way around."
          />
        </FadeIn>

        <div className="mt-14 grid gap-5 lg:grid-cols-4">
          {stages.map((stage, index) => (
            <FadeIn key={stage.step} delay={index * 80}>
              <article className="card-surface group h-full p-6 transition duration-300 hover:-translate-y-1 hover:shadow-md">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  Stage {stage.step}
                </p>
                <h3 className="mt-4 text-xl font-semibold">{stage.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">
                  {stage.description}
                </p>
              </article>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={120}>
          <div className="mt-10 rounded-2xl border border-primary/15 bg-primary/5 px-6 py-5 sm:px-8">
            <p className="text-sm font-medium text-primary">
              Operational spine
            </p>
            <p className="mt-2 text-base leading-7 text-foreground">
              One shift assignment → one approved actual time → one timesheet
              line → billing-ready → export.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
