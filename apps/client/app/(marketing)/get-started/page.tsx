import { PageShell } from "@/components/layout/PageShell";
import { ContactForm } from "@/components/get-started/ContactForm";
import { ContactHero } from "@/components/get-started/ContactHero";

export default function GetStartedPage() {
  return (
    <PageShell>
      <ContactHero />
      <ContactForm />
    </PageShell>
  );
}
