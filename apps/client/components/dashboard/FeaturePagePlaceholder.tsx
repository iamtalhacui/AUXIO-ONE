import { PageHeader } from "@/components/dashboard/PageHeader";

export function FeaturePagePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <div className="dashboard-card border-dashed p-6">
        <p className="text-sm text-muted">
          This area is available based on your role permissions. More tools will appear here as
          they are enabled for your organisation.
        </p>
      </div>
    </div>
  );
}
