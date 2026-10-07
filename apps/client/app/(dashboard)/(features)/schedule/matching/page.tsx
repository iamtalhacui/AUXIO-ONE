import { Suspense } from "react";
import { PagePermissionGuard } from "@/components/auth/PagePermissionGuard";
import { MatchingContent } from "@/components/rostering/MatchingContent";

export default function MatchingPage() {
  return (
    <PagePermissionGuard page="SCHEDULE">
      <Suspense fallback={<p className="text-sm text-muted">Loading matching…</p>}>
        <MatchingContent />
      </Suspense>
    </PagePermissionGuard>
  );
}
