import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { workflows } from "@/lib/content";

const statusStyles = {
  Live: "bg-primary/10 text-primary",
  "In progress": "bg-accent/10 text-accent",
  Planned: "bg-surface-muted text-muted",
} as const;

export function WorkflowSection() {
  return (
    <section id="workflows" className="border-y border-border bg-surface py-20 sm:py-28">
      <div className="section-shell">
        <FadeIn>
          <SectionHeading
            eyebrow="Workflows"
            title="Built workflow by workflow."
            description="We ship the operational spine in order — organisation setup first, then people, delivery, and handoff."
          />
        </FadeIn>

        <div className="mt-14 overflow-hidden rounded-2xl border border-border">
          <div className="grid grid-cols-[88px_1fr_120px] gap-4 border-b border-border bg-surface-muted px-6 py-4 text-xs font-bold uppercase tracking-[0.14em] text-muted">
            <span>Code</span>
            <span>Workflow</span>
            <span className="text-right">Status</span>
          </div>

          {workflows.map((workflow, index) => (
            <FadeIn key={workflow.code} delay={index * 50}>
              <div className="grid grid-cols-[88px_1fr_120px] items-center gap-4 border-b border-border bg-background px-6 py-5 last:border-b-0">
                <span className="font-mono text-sm font-semibold text-primary">
                  {workflow.code}
                </span>
                <span className="text-sm font-medium">{workflow.name}</span>
                <span className="text-right">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[workflow.status]}`}
                  >
                    {workflow.status}
                  </span>
                </span>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
