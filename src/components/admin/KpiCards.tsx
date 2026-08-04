import { ArrowDownRight, ArrowUpRight, CreditCard, Pause, Repeat, Users } from "lucide-react";
import { formatTTD } from "@/lib/format";
import type { AdminKpis } from "@/types/admin";

export function KpiCards({ kpis }: { kpis: AdminKpis }) {
  const cards = [
    { label: "Monthly recurring revenue", value: formatTTD(kpis.mrrCents), icon: CreditCard, note: `${formatTTD(kpis.arpuCents)} avg per member` },
    { label: "Active members", value: String(kpis.activeMembers), icon: Users, note: `${kpis.totalMembers} lifetime` },
    { label: "New this month", value: String(kpis.newThisMonth), icon: ArrowUpRight, note: `${kpis.autoRenewPct}% on auto-renew` },
    { label: "Churn this month", value: `${kpis.churnRatePct}%`, icon: ArrowDownRight, note: `${kpis.churnedThisMonth} cancelled or expired` },
    { label: "Paused", value: String(kpis.pausedMembers), icon: Pause, note: "Cycles frozen" },
    { label: "Reactivation pool", value: String(kpis.cancelledMembers), icon: Repeat, note: "Win-back candidates" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-border bg-card p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <div className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {card.label}
              </div>
              <div className="mt-2 font-display text-2xl font-bold">{card.value}</div>
            </div>
            <card.icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{card.note}</p>
        </div>
      ))}
    </div>
  );
}