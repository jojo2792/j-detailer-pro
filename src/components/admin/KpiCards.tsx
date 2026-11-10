import { ArrowUpRight, CreditCard, Pause, Repeat, Users } from "lucide-react";
import { formatTTD } from "@/lib/format";
import type { AdminKpis } from "@/types/admin";

export function KpiCards({ kpis, month }: { kpis: AdminKpis; month: string }) {
  const cards = [
    { label: "Active monthly plan value", value: formatTTD(kpis.mrrCents), icon: CreditCard, note: "Loaded active memberships × listed monthly price; custom quotes excluded. Not collected revenue." },
    { label: "Active memberships", value: String(kpis.activeMembers), icon: Users, note: `${kpis.totalMembers} loaded membership records · Current status` },
    { label: "Memberships created", value: String(kpis.newThisMonth), icon: ArrowUpRight, note: `${month} · Existing summary’s calendar-month bucket` },
    { label: "Active auto-renew", value: `${kpis.autoRenewPct}%`, icon: Repeat, note: "Enabled among loaded active memberships · Not payment success" },
    { label: "Paused memberships", value: String(kpis.pausedMembers), icon: Pause, note: "Current status · Loaded records" },
    { label: "Cancelled or expired", value: String(kpis.cancelledMembers), icon: Repeat, note: "Current status · Loaded records, not this month’s cancellations" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-border bg-card p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-muted-foreground">
                {card.label}
              </div>
              <div className="mt-2 break-words font-display text-2xl font-bold">{card.value}</div>
            </div>
            <card.icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{card.note}</p>
        </div>
      ))}
    </div>
  );
}