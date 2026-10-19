import { PageHeader } from "@/components/dashboard/PageHeader";
import { SettingsPageContent } from "@/components/super-admin/settings/SettingsPageContent";

export default function AdminSettingsPage() {
  return (
    <>
      <PageHeader
        title="Platform settings"
        description="Schedule maintenance windows or enable an emergency lock for organisation users."
      />
      <SettingsPageContent />
    </>
  );
}
