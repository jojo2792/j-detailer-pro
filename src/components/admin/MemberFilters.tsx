import { Filter, RotateCcw, Search } from "lucide-react";
import { MEMBER_SORTS, MEMBER_STATUSES, activeFilterCount } from "@/lib/admin-filters";
import type { AdminMemberFilters, MemberSortKey } from "@/types/admin";
import type { MembershipStatus } from "@/types/membership";
import { cn } from "@/lib/utils";

interface Props {
  filters: AdminMemberFilters;
  plans: { slug: string; name: string }[];
  onChange: (patch: Partial<AdminMemberFilters>) => void;
  onReset: () => void;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

const chip = "rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest transition";

export function MemberFilters({ filters, plans, onChange, onReset }: Props) {
  const count = activeFilterCount(filters);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Filter className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <h3 className="truncate font-display text-base font-bold">
            Filters {count > 0 && <span className="text-primary">({count})</span>}
          </h3>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest hover:border-primary hover:text-primary"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset
        </button>
      </div>

      <label className="mt-5 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="sr-only">Search members</span>
        <input
          type="search"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Search name, email, phone or plan"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>

      <div className="mt-5 space-y-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {MEMBER_STATUSES.map((status: MembershipStatus) => {
              const on = filters.statuses.includes(status);
              return (
                <button
                  key={status}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange({ statuses: toggle(filters.statuses, status) })}
                  className={cn(chip, on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/60")}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Plan</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {plans.map((plan) => {
              const on = filters.planSlugs.includes(plan.slug);
              return (
                <button
                  key={plan.slug}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange({ planSlugs: toggle(filters.planSlugs, plan.slug) })}
                  className={cn(chip, on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/60")}
                >
                  {plan.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Joined from</span>
            <input
              type="date"
              value={filters.from ?? ""}
              onChange={(e) => onChange({ from: e.target.value || null })}
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Joined to</span>
            <input
              type="date"
              value={filters.to ?? ""}
              onChange={(e) => onChange({ to: e.target.value || null })}
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Auto-renew</span>
            <select
              value={filters.autoRenew}
              onChange={(e) => onChange({ autoRenew: e.target.value as AdminMemberFilters["autoRenew"] })}
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="any">Any</option>
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sort by</span>
            <select
              value={filters.sort}
              onChange={(e) => onChange({ sort: e.target.value as MemberSortKey })}
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {MEMBER_SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Direction</span>
            <select
              value={filters.dir}
              onChange={(e) => onChange({ dir: e.target.value as AdminMemberFilters["dir"] })}
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}