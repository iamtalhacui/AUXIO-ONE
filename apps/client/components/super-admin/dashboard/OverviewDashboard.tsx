import {
  FeaturedWorkflowCard,
  WelcomeBanner,
} from "@/components/super-admin/dashboard/WelcomeBanner";
import { OverviewStatCards } from "@/components/super-admin/dashboard/OverviewStatCards";
import { RecentOrganisationsCard } from "@/components/super-admin/dashboard/RecentOrganisationsCard";

export function OverviewDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <WelcomeBanner />
        <FeaturedWorkflowCard />
      </div>

      <OverviewStatCards />
      <RecentOrganisationsCard />
    </div>
  );
}
