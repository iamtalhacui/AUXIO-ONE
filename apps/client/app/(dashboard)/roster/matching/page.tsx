import { Suspense } from "react";
import { MatchingContent } from "@/components/rostering/MatchingContent";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading matching…</p>}>
      <MatchingContent />
    </Suspense>
  );
}
