import { PageShell } from "@/components/layout/PageShell";
import {
  CtaSection,
  FeaturesSection,
  HeroSection,
  ModulesSection,
  RolesSection,
  StagesSection,
  WorkflowSection,
} from "@/components/landing";

export default function HomePage() {
  return (
    <PageShell>
      <HeroSection />
      <StagesSection />
      <FeaturesSection />
      <RolesSection />
      <WorkflowSection />
      <ModulesSection />
      <CtaSection />
    </PageShell>
  );
}
