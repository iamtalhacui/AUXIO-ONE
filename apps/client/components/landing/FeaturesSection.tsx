import {
  Building2,
  LayoutGrid,
  ShieldCheck,
  HeartHandshake,
  Users,
  MapPinned,
} from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { features } from "@/lib/content";

const icons = [Building2, LayoutGrid, ShieldCheck, HeartHandshake, Users, MapPinned];

export function FeaturesSection() {
  return (
    <section className="border-y border-border bg-surface py-20 sm:py-28">
      <div className="section-shell">
        <FadeIn>
          <SectionHeading
            eyebrow="Under the hood"
            title="Enterprise-grade foundations, without the enterprise complexity."
            description="Multi-tenant, role-aware, and module-driven — built so growing providers get compliance and operations working together from day one."
          />
        </FadeIn>

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = icons[index % icons.length];
            return (
              <FadeIn key={feature.title} delay={index * 60}>
                <article className="h-full rounded-2xl border border-border bg-background p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-md">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    {feature.description}
                  </p>
                </article>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
