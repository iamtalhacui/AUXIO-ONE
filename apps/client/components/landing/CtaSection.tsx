import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";

export function CtaSection() {
  return (
    <section className="pb-24 pt-4">
      <div className="section-shell">
        <FadeIn>
          <div className="relative overflow-hidden rounded-[2rem] bg-primary px-8 py-14 text-white sm:px-12 sm:py-16">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 animate-float" />
            <div className="absolute bottom-0 left-1/3 h-52 w-52 rounded-full bg-accent/20 blur-3xl animate-float-delayed" />

            <div className="relative max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-light">
                Ready when you are
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Bring your organisation onto AUXIO One.
              </h2>
              <p className="mt-4 text-base leading-7 text-white/80">
                Request access and our team will register your tenant, seed your
                first Org Admin, and configure your module ceiling.
              </p>
              <div className="mt-8">
                <Button
                  href="/get-started"
                  variant="secondary"
                  className="border-white/20 bg-white text-primary hover:bg-white/90"
                >
                  Book with us
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
