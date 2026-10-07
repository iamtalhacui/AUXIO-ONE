import { PagePermissionGuard } from "@/components/auth/PagePermissionGuard";
import { FeaturePagePlaceholder } from "@/components/dashboard/FeaturePagePlaceholder";

export default function FormsDocumentsPage() {
  return (
    <PagePermissionGuard page="FORMS_DOCUMENTS">
      <FeaturePagePlaceholder
        title="Forms & documents"
        description="Organisation forms and document libraries for roles granted this page."
      />
    </PagePermissionGuard>
  );
}
