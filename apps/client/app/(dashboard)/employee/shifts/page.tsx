import { PlaceholderPage } from "@/components/dashboard/RolePlaceholder";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function Page() {
  return (
    <>
      <PageHeader title="Shifts" description="View upcoming and completed shifts assigned to you." />
      <PlaceholderPage title="My shifts" description="Employee shift views will connect to shift execution workflows." />
    </>
  );
}
