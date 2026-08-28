import { PlaceholderPage } from "@/components/dashboard/RolePlaceholder";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function Page() {
  return (
    <>
      <PageHeader title="Timesheets" description="Submit and review your recorded shift time." />
      <PlaceholderPage title="Timesheets" description="Timesheet submission will connect to shift execution workflows." />
    </>
  );
}
