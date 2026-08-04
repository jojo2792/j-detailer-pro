import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatTTD } from "@/lib/format";
import type { PlanMixRow, RevenuePoint } from "@/types/admin";

const revenueConfig: ChartConfig = {
  revenueCents: { label: "Revenue", color: "var(--primary)" },
};

const growthConfig: ChartConfig = {
  newMembers: { label: "New members", color: "var(--primary)" },
  churned: { label: "Churned", color: "var(--destructive)" },
};

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h3 className="font-display text-lg font-bold">Revenue — last 12 months</h3>
      <p className="mt-1 text-xs text-muted-foreground">Recurring membership billings per month.</p>
      <ChartContainer config={revenueConfig} className="mt-6 h-[260px] w-full">
        <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} strokeOpacity={0.15} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={64}
            fontSize={11}
            tickFormatter={(value: number) => formatTTD(value)}
          />
          <ChartTooltip
            content={<ChartTooltipContent formatter={(value) => formatTTD(Number(value))} />}
          />
          <Area
            type="monotone"
            dataKey="revenueCents"
            stroke="var(--color-revenueCents)"
            fill="var(--color-revenueCents)"
            fillOpacity={0.18}
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

export function GrowthChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h3 className="font-display text-lg font-bold">Signups vs churn</h3>
      <p className="mt-1 text-xs text-muted-foreground">Net membership movement per month.</p>
      <ChartContainer config={growthConfig} className="mt-6 h-[260px] w-full">
        <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} strokeOpacity={0.15} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
          <YAxis tickLine={false} axisLine={false} width={32} fontSize={11} allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="newMembers" fill="var(--color-newMembers)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="churned" fill="var(--color-churned)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

export function PlanMixChart({ data }: { data: PlanMixRow[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h3 className="font-display text-lg font-bold">Revenue by plan</h3>
      <p className="mt-1 text-xs text-muted-foreground">Active members contributing to MRR.</p>
      <div className="mt-6 h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid horizontal={false} strokeOpacity={0.15} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              tickFormatter={(value: number) => formatTTD(value)}
            />
            <YAxis type="category" dataKey="planName" width={92} tickLine={false} axisLine={false} fontSize={11} />
            <Bar dataKey="mrrCents" fill="var(--primary)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
        {data.map((row) => (
          <li key={row.planSlug} className="flex justify-between gap-3">
            <span className="truncate">{row.planName}</span>
            <span>
              {row.members} member{row.members === 1 ? "" : "s"} · {formatTTD(row.mrrCents)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}