import { useEffect, useState } from "react";
import { AlertCircle, CalendarCheck, Loader2, RefreshCw, Search, Users } from "lucide-react";
import { StaffJobCard } from "@/components/staff/StaffJobCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStaffBoard, useStaffJobActions } from "@/hooks/use-staff";
import { formatDateTime } from "@/lib/format";
import { filterStaffJobs, groupStaffJobs, hasPassedStart, isOpenJob, technicianLabel, technicianWorkload } from "@/lib/staff-queue";
import type { AssignmentFilter } from "@/lib/staff-queue";
import type { StaffScope } from "@/types/staff";

const SCOPES: { value: StaffScope; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "mine", label: "Assigned to me" },
];

export function StaffBoard() {
  const [scope, setScope] = useState<StaffScope>("today");
  const [search, setSearch] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>("all");
  const [now, setNow] = useState(() => Date.now());
  const board = useStaffBoard(scope, true);
  const { status, assignment } = useStaffJobActions(scope);
  const busyId = status.variables?.bookingId ?? assignment.variables?.bookingId ?? null;
  const pending = status.isPending || assignment.isPending;
  const jobs = board.data?.jobs ?? [];
  const visibleJobs = filterStaffJobs(jobs, search, assignmentFilter);
  const groups = groupStaffJobs(visibleJobs);
  const workloads = technicianWorkload(jobs);
  const hasFilters = search.trim().length > 0 || assignmentFilter !== "all";
  const scopeLabel = SCOPES.find((option) => option.value === scope)?.label ?? "Today";
  const scopeCounts = groupStaffJobs(jobs);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const clearFilters = () => {
    setSearch("");
    setAssignmentFilter("all");
  };

  const renderJob = (job: (typeof jobs)[number]) => (
    <StaffJobCard
      key={job.id}
      job={job}
      busy={pending && busyId === job.id}
      startPassed={hasPassedStart(job, now)}
      onStatus={(next) => status.mutate({ bookingId: job.id, status: next })}
      onAssign={(claim) => assignment.mutate({ bookingId: job.id, claim })}
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Appointment scope">
          {SCOPES.map((option) => (
            <Button
              key={option.value}
              variant={scope === option.value ? "default" : "outline"}
              onClick={() => { setScope(option.value); clearFilters(); }}
              aria-pressed={scope === option.value}
            >
              {option.label}
              {board.data && <span className="tabular-nums">({board.data.counts[option.value]})</span>}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="icon" aria-label="Refresh job queue" title="Refresh job queue"
          disabled={board.isFetching} onClick={() => void board.refetch()}>
          <RefreshCw className={board.isFetching ? "animate-spin" : ""} aria-hidden />
        </Button>
      </div>

      {board.isLoading && !board.data ? (
        <div role="status" className="flex items-center gap-3 border-y border-border py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden /> Loading your schedule…
        </div>
      ) : !board.data ? (
        <div role="alert" className="border-y border-border py-8">
          <h2 className="font-display text-lg font-bold">Your schedule didn&apos;t load</h2>
          <p className="mt-2 text-sm text-muted-foreground">Please try again in a moment.</p>
          <Button variant="outline" className="mt-4" onClick={() => void board.refetch()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p role="status">{board.isFetching ? "Refreshing… · " : ""}Updated {formatDateTime(board.data.generatedAt)} · Trinidad time</p>
            <p>From today onward · Excludes cancelled and earlier dates · Up to 200 bookings; counts reflect loaded records.</p>
            {board.isError && <p role="alert" className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden /> Refresh failed. Showing the last loaded schedule.
            </p>}
          </div>

          <dl className="grid grid-cols-2 gap-4 border-y border-border py-5 sm:grid-cols-4" aria-label={`${scopeLabel} loaded queue totals`}>
            {[
              { label: "Open jobs", value: jobs.filter(isOpenJob).length },
              { label: "In progress", value: jobs.filter((job) => job.status === "in_progress").length },
              { label: "Start time passed", value: jobs.filter((job) => hasPassedStart(job, now)).length },
              { label: "Open · unassigned", value: jobs.filter((job) => isOpenJob(job) && !job.technicianId).length },
            ].map((stat) => <div key={stat.label}>
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-primary">{stat.value}</dd>
            </div>)}
          </dl>

          <section aria-labelledby="staff-workload-heading" className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="staff-workload-heading" className="flex items-center gap-2 font-display text-sm font-semibold">
                <Users className="h-4 w-4 text-primary" aria-hidden /> Technician workload
              </h2>
              <p className="text-xs text-muted-foreground">{scopeLabel} · Open jobs · Before filters</p>
            </div>
            {workloads.length === 0 ? <p className="text-sm text-muted-foreground">No open assignments in this view.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-left text-xs" aria-label={`${scopeLabel} technician workload`}>
                  <thead className="text-muted-foreground"><tr>
                    <th scope="col" className="w-2/5 py-2 pr-2 font-medium">Assignment</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">Queued</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">In progress</th>
                    <th scope="col" className="py-2 pl-2 text-right font-medium">Scheduled min</th>
                  </tr></thead>
                  <tbody>{workloads.map((row) => <tr key={row.technicianId ?? "unassigned"} className="border-t border-border">
                    <th scope="row" title={row.technicianId ?? undefined} className="break-words py-2.5 pr-2 font-medium">{technicianLabel(row.technicianId, row.assignedToMe)}</th>
                    <td className="px-2 py-2.5 text-right tabular-nums">{row.queued}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums">{row.inProgress}</td>
                    <td className="py-2.5 pl-2 text-right tabular-nums">{row.scheduledMinutes}</td>
                  </tr>)}</tbody>
                </table>
              </div>
            )}
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1 basis-64">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
              <Input type="search" aria-label="Search appointments" placeholder="Reference, customer, service, vehicle or city"
                value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
            </div>
            <div role="group" aria-label="Assignment filter" className="flex flex-wrap gap-1">
              {([{ value: "all", label: "All" }, { value: "unassigned", label: "Unassigned" }, { value: "mine", label: "Mine" }] as const).map((option) => (
                <Button key={option.value} size="sm" variant={assignmentFilter === option.value ? "default" : "outline"}
                  aria-pressed={assignmentFilter === option.value} onClick={() => setAssignmentFilter(option.value)}>{option.label}</Button>
              ))}
            </div>
          </div>
          <p role="status" className="text-xs text-muted-foreground">{visibleJobs.length} of {jobs.length} loaded appointments · {scopeLabel}</p>

          {visibleJobs.length === 0 ? (
            <div className="border-y border-border py-8 text-center">
              <CalendarCheck className="mx-auto h-7 w-7 text-primary" aria-hidden />
              <h2 className="mt-3 font-display text-lg font-semibold">{hasFilters ? "No matching appointments" : "No appointments in this view"}</h2>
              {hasFilters && <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear filters</Button>}
            </div>
          ) : (
            <>
              <div className="grid items-start gap-5 xl:grid-cols-3">
                {groups.filter((group) => group.value !== "completed" && group.value !== "cancelled").map((group) => (
                  <section key={group.value} aria-labelledby={`queue-${group.value}`} className="min-w-0 space-y-3">
                    <h2 id={`queue-${group.value}`} className="flex items-center justify-between gap-2 border-b border-border pb-3 font-display text-sm font-semibold">
                      {group.label}
                      <span className="text-primary tabular-nums">{group.jobs.length}{hasFilters && ` / ${scopeCounts.find((item) => item.value === group.value)?.jobs.length ?? 0}`}</span>
                    </h2>
                    {group.jobs.length ? <ul className="space-y-3">{group.jobs.map(renderJob)}</ul> : <p className="py-4 text-xs text-muted-foreground">No {hasFilters ? "matching " : ""}jobs.</p>}
                  </section>
                ))}
              </div>
              {groups.filter((group) => (group.value === "completed" || group.value === "cancelled") && group.jobs.length > 0).map((group) => (
                <details key={group.value} className="border-t border-border pt-4">
                  <summary className="cursor-pointer text-sm font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">{group.label} ({group.jobs.length})</summary>
                  <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{group.jobs.map(renderJob)}</ul>
                </details>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
