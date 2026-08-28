import { PlaceholderPage } from "@/components/dashboard/RolePlaceholder";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function Page() {
  return (
    <>
      <PageHeader title="Settings" description="Organisation profile and security settings." />
      <PlaceholderPage
        title="Organisation settings"
        description="Org-level configuration will be added when the settings API is ready."
      />
    </>
  );
}
