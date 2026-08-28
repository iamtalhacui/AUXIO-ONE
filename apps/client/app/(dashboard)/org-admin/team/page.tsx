import { PlaceholderPage } from "@/components/dashboard/RolePlaceholder";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function Page() {
  return (
    <>
      <PageHeader title="Team" description="Invite managers, rostering experts, and employees." />
      <PlaceholderPage
        title="Team management"
        description="User invites and role assignment will be built in a later workflow."
      />
    </>
  );
}
