import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { features } from "@/lib/content";

export function FeaturesSection() {
  return (
    <section className="border-y border-border bg-surface py-20 sm:py-28">
      <div className="section-shell">
        <FadeIn>
          <SectionHeading
            eyebrow="Why AUXIO One"
            title="Configurable SaaS without the chaos."
            description="Multi-tenant, role-aware, and module-driven — designed for providers who need compliance and operations in the same system."
          />
        </FadeIn>

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => (
            <FadeIn key={feature.title} delay={index * 60}>
              <article className="h-full rounded-2xl border border-border bg-background p-6 transition duration-300 hover:border-primary/20 hover:shadow-sm">
                <div className="mb-4 h-1 w-10 rounded-full bg-accent" />
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">
                  {feature.description}
                </p>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
