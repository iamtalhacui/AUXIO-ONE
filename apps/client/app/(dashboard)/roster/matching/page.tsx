import { PlaceholderPage } from "@/components/dashboard/RolePlaceholder";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function Page() {
  return (
    <>
      <PageHeader title="Matching" description="Match support workers to participant shifts." />
      <PlaceholderPage title="Matching" description="Shift matching workflows will be added in the rostering module." />
    </>
  );
}
