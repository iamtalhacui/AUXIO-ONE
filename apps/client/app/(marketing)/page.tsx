import { PageShell } from "@/components/layout/PageShell";
import {
  BenefitsSection,
  CtaSection,
  FaqSection,
  FeaturesSection,
  HeroSection,
  RolesSection,
  StagesSection,
} from "@/components/landing";

export default function HomePage() {
  return (
    <PageShell>
      <HeroSection />
      <BenefitsSection />
      <StagesSection />
      <FeaturesSection />
      <RolesSection />
      <FaqSection />
      <CtaSection />
    </PageShell>
  );
}
