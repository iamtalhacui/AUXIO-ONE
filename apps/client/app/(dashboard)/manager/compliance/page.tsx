import { PlaceholderPage } from "@/components/dashboard/RolePlaceholder";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function Page() {
  return (
    <>
      <PageHeader title="Compliance" description="Track certifications, expiries, and policy acknowledgements." />
      <PlaceholderPage title="Compliance" description="Compliance dashboards will connect to workforce onboarding data." />
    </>
  );
}
