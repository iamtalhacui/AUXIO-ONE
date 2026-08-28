import { PlaceholderPage } from "@/components/dashboard/RolePlaceholder";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function Page() {
  return (
    <>
      <PageHeader title="Modules" description="Enable or disable modules within your organisation ceiling." />
      <PlaceholderPage
        title="Module management"
        description="Org Admin module toggles will connect to the organisation modules API."
      />
    </>
  );
}
