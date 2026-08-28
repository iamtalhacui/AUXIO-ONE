import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { roles } from "@/lib/content";

export function RolesSection() {
  return (
    <section id="roles" className="py-20 sm:py-28">
      <div className="section-shell">
        <FadeIn>
          <SectionHeading
            eyebrow="Roles"
            title="Five roles. Participants stay as records."
            description="Super Admin through Employee — each with a clear boundary. Participants and referrers never log in; staff manage their records on their behalf."
          />
        </FadeIn>

        <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((role, index) => (
            <FadeIn key={role.name} delay={index * 70}>
              <article className="card-surface h-full p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{role.name}</h3>
                  <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-muted">
                    {role.scope}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted">
                  {role.description}
                </p>
              </article>
            </FadeIn>
          ))}

          <FadeIn delay={350}>
            <article className="flex h-full flex-col justify-center rounded-2xl border border-dashed border-border bg-surface-muted/60 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
                Not users
              </p>
              <h3 className="mt-3 text-lg font-semibold">Participants & referrers</h3>
              <p className="mt-3 text-sm leading-7 text-muted">
                Stored as records with onboarding checklists, care needs, and
                CRM history — managed entirely by your staff.
              </p>
            </article>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
