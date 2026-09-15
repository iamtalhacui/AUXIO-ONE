import { PageHeader } from "@/components/dashboard/PageHeader";
import { DemoRequestsPageContent } from "@/components/super-admin/demos/DemoRequestsPageContent";

export default function DemoRequestsPage() {
  return (
    <>
      <PageHeader
        title="Demo Requests"
        description="Inbound Book a Demo submissions from the marketing site."
      />
      <DemoRequestsPageContent />
    </>
  );
}
