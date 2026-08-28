import { PageHeader } from "@/components/dashboard/PageHeader";
import { InvitesPageContent } from "@/components/super-admin/invites/InvitesPageContent";

export default function InvitesPage() {
  return (
    <>
      <PageHeader
        title="Pending invites"
        description="Org Admin accounts awaiting activation or password setup."
      />
      <InvitesPageContent />
    </>
  );
}
