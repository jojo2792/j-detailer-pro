import { GrowthChart, PlanMixChart, RevenueChart } from "@/components/admin/RevenueChart";
import type { PlanMixRow, RevenuePoint } from "@/types/admin";

export default function RevenueCharts({
  revenue,
  planMix,
}: {
  revenue: RevenuePoint[];
  planMix: PlanMixRow[];
}) {
  return (
    <div className="space-y-6">
      <RevenueChart data={revenue} />
      <div className="grid gap-6 xl:grid-cols-2">
        <GrowthChart data={revenue} />
        <PlanMixChart data={planMix} />
      </div>
    </div>
  );
}