import { PageHeader } from "@/components/dashboard/PageHeader";
import { SettingsPageContent } from "@/components/super-admin/settings/SettingsPageContent";

export default function AdminSettingsPage() {
  return (
    <>
      <PageHeader
        title="Platform settings"
        description="Turn maintenance mode on or off for organisation users."
      />
      <SettingsPageContent />
    </>
  );
}
