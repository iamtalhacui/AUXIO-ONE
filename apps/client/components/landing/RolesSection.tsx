import Image from "next/image";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { roles } from "@/lib/content";
import { landingImages } from "@/lib/landing-images";

export function RolesSection() {
  return (
    <section id="roles" className="border-y border-border bg-surface py-20 sm:py-28">
      <div className="section-shell grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <FadeIn>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border/60 shadow-lg shadow-primary/5">
            <Image
              src={landingImages.teamMeeting}
              alt="A care team meeting to coordinate a participant's support plan"
              fill
              sizes="(min-width: 1024px) 520px, 90vw"
              className="object-cover"
            />
          </div>
        </FadeIn>

        <div>
          <FadeIn>
            <SectionHeading
              eyebrow="Who it's for"
              title="Built for everyone on your care team."
              description="Every role gets exactly the tools they need — from head office to the field — while participants and referrers stay as records your staff manage on their behalf."
            />
          </FadeIn>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {roles.map((role, index) => (
              <FadeIn key={role.name} delay={index * 70}>
                <article className="h-full rounded-2xl border border-border bg-background p-5 transition duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold">{role.name}</h3>
                    <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-muted">
                      {role.scope}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {role.description}
                  </p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
