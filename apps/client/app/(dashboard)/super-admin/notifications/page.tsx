import { PageHeader } from "@/components/dashboard/PageHeader";
import { NotificationsPageContent } from "@/components/super-admin/notifications/NotificationsPageContent";

export default function NotificationsPage() {
  return (
    <>
      <PageHeader
        title="Notifications"
        description="Platform alerts and Super Admin notifications."
      />
      <NotificationsPageContent />
    </>
  );
}
