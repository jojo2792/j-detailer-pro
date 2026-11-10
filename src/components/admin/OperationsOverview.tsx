import { Link } from "@tanstack/react-router";
import { ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStaffBoard } from "@/hooks/use-staff";
import { bookingSummary, memberPageActivity } from "@/lib/admin-operations";
import { formatDateTime } from "@/lib/format";
import type { AdminMembersPage } from "@/types/admin";

export function SnapshotState({ updatedAt, fetching, stale, error, retry }: {
  updatedAt?: string; fetching: boolean; stale: boolean; error: boolean; retry: () => void;
}) {
  return <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
    <p role={error ? "alert" : "status"}>
      {error ? updatedAt ? "Refresh failed · Last loaded data · " : "Summary unavailable · " : fetching ? "Refreshing · " : stale ? "Snapshot may be out of date · " : ""}
      {updatedAt && `Updated ${formatDateTime(updatedAt)} · Trinidad time`}
    </p>
    <Button variant="outline" size="icon" title="Refresh summary" aria-label="Refresh summary" disabled={fetching} onClick={retry}>
      <RefreshCw className={fetching ? "animate-spin" : ""} aria-hidden />
    </Button>
  </div>;
}

function BookingSnapshot({ scope }: { scope: "today" | "upcoming" }) {
  const query = useStaffBoard(scope, true);
  const summary = query.data ? bookingSummary(query.data.jobs) : null;
  return <section className="min-w-0 space-y-3 border-t border-border pt-4" aria-label={`${scope} booking snapshot`}>
    <h3 className="font-display text-base font-semibold">{scope === "today" ? "Today’s bookings" : "Upcoming bookings"}</h3>
    <SnapshotState updatedAt={query.data?.generatedAt} fetching={query.isFetching} stale={query.isStale}
      error={query.isError} retry={() => void query.refetch()} />
    {query.isLoading ? <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading bookings…</p> : summary ? <>
      <dl className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3">
        {[
          ["Open jobs", summary.open], ["Awaiting confirmation", summary.pending], ["Confirmed", summary.confirmed],
          ["In progress", summary.inProgress], ["Completed", summary.completed], ["Open · unassigned", summary.unassigned],
        ].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-xl font-semibold tabular-nums text-primary">{value}</dd></div>)}
      </dl>
      <p className="text-xs text-muted-foreground">{summary.loaded} loaded bookings · {scope === "today" ? "Today, 00:00–24:00 Trinidad time" : "Scheduled at or after the snapshot time; no fixed end date"}</p>
      {summary.loaded === 0 && <p className="text-sm text-muted-foreground">No bookings returned in this range.</p>}
    </> : <p className="text-sm text-muted-foreground">Counts are unavailable, not zero.</p>}
  </section>;
}

/** Mounted only in the existing admin-permission branch. No new data source or write actions. */
export function OperationsOverview() {
  return <section aria-labelledby="operations-heading" className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="operations-heading" className="font-display text-xl font-bold">Booking operations</h2>
      <Button variant="outline" size="sm" asChild><Link to="/staff">Open job board <ArrowRight aria-hidden /></Link></Button>
    </div>
    <p className="text-xs text-muted-foreground">Loaded records only: existing board reads at most 200 bookings from today onward. Earlier dates and cancelled bookings are excluded; cancelled totals are unavailable. Today and upcoming overlap. Not a full backlog.</p>
    <div className="grid gap-6 lg:grid-cols-2"><BookingSnapshot scope="today" /><BookingSnapshot scope="upcoming" /></div>
  </section>;
}

export function CustomerPageActivity({ page, updatedAt }: { page: AdminMembersPage; updatedAt: number }) {
  const activity = memberPageActivity(page.rows, updatedAt);
  return <div className="space-y-3 border-y border-border py-4">
    <h3 className="font-display text-base font-semibold">Customer activity · Current filtered page</h3>
    <dl className="grid gap-4 sm:grid-cols-3">
      {[["Distinct customers shown", activity.customers], ["Active memberships renewing in 7 days", activity.renewing], ["Active memberships ending at period end", activity.ending]].map(([label, value]) =>
        <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd></div>)}
    </dl>
    <p className="text-xs text-muted-foreground">Page {page.page} · {page.rows.length} of {page.total} loaded matching memberships. Renewal window: {formatDateTime(new Date(updatedAt).toISOString())} to {formatDateTime(new Date(updatedAt + 7 * 86_400_000).toISOString())}, end exclusive. Scheduled dates, not confirmed payments. Customers without memberships are not included.</p>
  </div>;
}