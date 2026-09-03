import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { stages } from "@/lib/content";

export function StagesSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28">
      <div className="section-shell">
        <FadeIn>
          <SectionHeading
            eyebrow="How it works"
            title="From sign-up to service delivery in four simple stages."
            description="We handle the setup so your team can focus on care from day one — no lengthy implementation, no steep learning curve."
          />
        </FadeIn>

        <div className="mt-14 grid gap-5 lg:grid-cols-4">
          {stages.map((stage, index) => (
            <FadeIn key={stage.step} delay={index * 80}>
              <article className="card-surface group relative h-full overflow-hidden p-6 transition duration-300 hover:-translate-y-1 hover:shadow-md">
                <p className="text-4xl font-bold text-primary/10 transition group-hover:text-primary/20">
                  {stage.step}
                </p>
                <h3 className="mt-2 text-xl font-semibold">{stage.title}</h3>
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
              The result
            </p>
            <p className="mt-2 text-base leading-7 text-foreground">
              One published shift → one approved timesheet → one billing-ready
              line — with nothing lost in between.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
