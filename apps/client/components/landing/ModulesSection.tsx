import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { modules } from "@/lib/content";

export function ModulesSection() {
  return (
    <section id="modules" className="py-20 sm:py-28">
      <div className="section-shell">
        <FadeIn>
          <SectionHeading
            eyebrow="Modules"
            title="Turn on what you need. Keep the rest for later."
            description="Super Admin grants a module ceiling at registration. Org Admin toggles modules within that ceiling — off hides, on restores, nothing is deleted."
          />
        </FadeIn>

        <FadeIn delay={80}>
          <div className="mt-14 flex flex-wrap gap-3">
            {modules.map((module, index) => (
              <span
                key={module}
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
                style={{ transitionDelay: `${index * 20}ms` }}
              >
                {module}
              </span>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
