import { PageHeader } from "@/components/dashboard/PageHeader";
import { SettingsPageContent } from "@/components/super-admin/settings/SettingsPageContent";

export default function AdminSettingsPage() {
  return (
    <>
      <PageHeader
        title="Platform settings"
        description="Global configuration for the AUXIO One platform."
      />
      <SettingsPageContent />
    </>
  );
}
