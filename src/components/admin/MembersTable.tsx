import { Download, Loader2 } from "lucide-react";
import { MembershipStatusBadge } from "@/components/membership/MembershipStatusBadge";
import { formatDate, formatTTD } from "@/lib/format";
import { usePagination } from "@/hooks/use-admin";
import { cn } from "@/lib/utils";
import type { AdminMemberFilters, AdminMembersPage } from "@/types/admin";

interface Props {
  page: AdminMembersPage | undefined;
  filters: AdminMemberFilters;
  isFetching: boolean;
  canExport: boolean;
  isExporting: boolean;
  onExport: () => void;
  onChange: (patch: Partial<AdminMemberFilters>) => void;
}

export default function MembersTable({
  page,
  filters,
  isFetching,
  canExport,
  isExporting,
  onExport,
  onChange,
}: Props) {
  const rows = page?.rows ?? [];
  const pageCount = page?.pageCount ?? 1;
  const current = page?.page ?? filters.page;
  const pages = usePagination(current, pageCount);

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border p-5 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-bold">Members</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {page ? `${page.total} matching record${page.total === 1 ? "" : "s"}` : "Loading records"}
            {isFetching && page ? " · refreshing" : ""}
          </p>
        </div>
        {canExport && (
          <button
            type="button"
            onClick={onExport}
            disabled={isExporting}
            className="flex shrink-0 items-center gap-2 rounded-full bg-gradient-gold px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-background disabled:opacity-60"
          >
            {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Download className="h-3.5 w-3.5" aria-hidden />}
            Export CSV
          </button>
        )}
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-border md:hidden">
        {rows.map((row) => (
          <li key={row.membershipId} className="p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{row.fullName}</p>
                <p className="truncate text-xs text-muted-foreground">{row.email}</p>
              </div>
              <MembershipStatusBadge status={row.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <dt className="uppercase tracking-widest">Plan</dt>
                <dd className="text-foreground">{row.planName}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-widest">Value</dt>
                <dd className="text-foreground">{formatTTD(row.priceCents)}/mo</dd>
              </div>
              <div>
                <dt className="uppercase tracking-widest">Renews</dt>
                <dd className="text-foreground">{formatDate(row.renewalDate)}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-widest">Usage</dt>
                <dd className="text-foreground">
                  {row.washesUsed}/{row.washLimit} washes · {row.interiorUsed}/{row.interiorLimit} interiors
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <th scope="col" className="px-5 py-3 font-semibold">Customer</th>
              <th scope="col" className="px-5 py-3 font-semibold">Plan</th>
              <th scope="col" className="px-5 py-3 font-semibold">Status</th>
              <th scope="col" className="px-5 py-3 font-semibold">Value</th>
              <th scope="col" className="px-5 py-3 font-semibold">Usage</th>
              <th scope="col" className="px-5 py-3 font-semibold">Joined</th>
              <th scope="col" className="px-5 py-3 font-semibold">Renews</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.membershipId} className="border-b border-border/60 last:border-0">
                <td className="max-w-[220px] px-5 py-4">
                  <div className="truncate font-semibold">{row.fullName}</div>
                  <div className="truncate text-xs text-muted-foreground">{row.email}</div>
                  {row.phone && <div className="truncate text-xs text-muted-foreground">{row.phone}</div>}
                </td>
                <td className="px-5 py-4">
                  {row.planName}
                  {row.cancelAtPeriodEnd && (
                    <div className="text-xs text-destructive">Cancels at period end</div>
                  )}
                </td>
                <td className="px-5 py-4"><MembershipStatusBadge status={row.status} /></td>
                <td className="px-5 py-4">
                  {formatTTD(row.priceCents)}
                  <div className="text-xs text-muted-foreground">{row.autoRenew ? "Auto-renew on" : "Auto-renew off"}</div>
                </td>
                <td className="px-5 py-4 text-xs text-muted-foreground">
                  {row.washesUsed}/{row.washLimit} washes
                  <div>{row.interiorUsed}/{row.interiorLimit} interiors</div>
                </td>
                <td className="px-5 py-4 text-xs text-muted-foreground">{formatDate(row.startedAt)}</td>
                <td className="px-5 py-4 text-xs text-muted-foreground">{formatDate(row.renewalDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <p className="p-8 text-center text-sm text-muted-foreground">
          No members match these filters yet.
        </p>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border p-4 sm:flex sm:justify-between">
        <label className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <span className="shrink-0 uppercase tracking-widest">Rows</span>
          <select
            value={filters.pageSize}
            onChange={(e) => onChange({ pageSize: Number(e.target.value), page: 1 })}
            className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground outline-none"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onChange({ page: Math.max(current - 1, 1) })}
            disabled={current <= 1}
            className="rounded-lg border border-border px-2.5 py-1 text-xs disabled:opacity-40"
          >
            Prev
          </button>
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange({ page: p })}
              aria-current={p === current ? "page" : undefined}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs",
                p === current ? "border-primary bg-primary/10 text-primary" : "border-border",
              )}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange({ page: Math.min(current + 1, pageCount) })}
            disabled={current >= pageCount}
            className="rounded-lg border border-border px-2.5 py-1 text-xs disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}