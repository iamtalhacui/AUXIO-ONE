import Image from "next/image";
import { Check } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { benefits } from "@/lib/content";
import { landingImages } from "@/lib/landing-images";

export function BenefitsSection() {
  return (
    <section id="product" className="py-20 sm:py-28">
      <div className="section-shell">
        <FadeIn>
          <SectionHeading
            eyebrow="Why NDIS providers choose AUXIO One"
            title="Everything you need to run care operations — in one platform."
            description="From the first roster to the final invoice, AUXIO One replaces spreadsheets, group chats, and disconnected tools with one connected workflow."
          />
        </FadeIn>

        <div className="mt-16 space-y-20">
          {benefits.map((benefit, index) => {
            const reversed = index % 2 === 1;
            const image = landingImages[benefit.image as keyof typeof landingImages] as string;

            return (
              <FadeIn key={benefit.title}>
                <div
                  className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                    reversed ? "lg:[&>*:first-child]:order-2" : ""
                  }`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border/60 shadow-lg shadow-primary/5 transition duration-500 hover:scale-[1.01]">
                    <Image
                      src={image}
                      alt={benefit.imageAlt}
                      fill
                      sizes="(min-width: 1024px) 560px, 90vw"
                      className="object-cover"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                      {benefit.eyebrow}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                      {benefit.title}
                    </h3>
                    <p className="mt-4 text-base leading-7 text-muted">
                      {benefit.description}
                    </p>
                    <ul className="mt-6 space-y-3">
                      {benefit.points.map((point) => (
                        <li key={point} className="flex items-start gap-3 text-sm text-foreground">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
