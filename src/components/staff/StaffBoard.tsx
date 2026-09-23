import { useState } from "react";
import { CalendarCheck, Loader2, RefreshCw } from "lucide-react";
import { StaffJobCard } from "@/components/staff/StaffJobCard";
import { useStaffBoard, useStaffJobActions } from "@/hooks/use-staff";
import type { StaffScope } from "@/types/staff";

const SCOPES: { value: StaffScope; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "mine", label: "Assigned to me" },
];

export function StaffBoard() {
  const [scope, setScope] = useState<StaffScope>("today");
  const board = useStaffBoard(scope, true);
  const { status, assignment } = useStaffJobActions(scope);
  const busyId = status.variables?.bookingId ?? assignment.variables?.bookingId ?? null;
  const pending = status.isPending || assignment.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {SCOPES.map((option) => {
          const count = board.data?.counts[option.value];
          const active = scope === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setScope(option.value)}
              aria-pressed={active}
              className={`rounded-full border px-5 py-2.5 text-xs font-semibold uppercase tracking-widest transition ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {option.label}
              {typeof count === "number" && ` (${count})`}
            </button>
          );
        })}
      </div>

      {board.isLoading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden /> Loading your schedule…
        </div>
      ) : board.isError || !board.data ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold">Your schedule didn&apos;t load</h2>
          <p className="mt-2 text-sm text-muted-foreground">Please try again in a moment.</p>
          <button
            type="button"
            onClick={() => void board.refetch()}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs font-semibold uppercase tracking-widest hover:border-primary hover:text-primary"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Retry
          </button>
        </div>
      ) : board.data.jobs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <CalendarCheck className="mx-auto h-8 w-8 text-primary" aria-hidden />
          <h2 className="mt-4 font-display text-lg font-bold">Nothing here right now</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {scope === "mine"
              ? "Claim a job from Today or Upcoming and it will appear here."
              : "No appointments in this view yet."}
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {board.data.jobs.map((job) => (
            <StaffJobCard
              key={job.id}
              job={job}
              busy={pending && busyId === job.id}
              onStatus={(next) => status.mutate({ bookingId: job.id, status: next })}
              onAssign={(claim) => assignment.mutate({ bookingId: job.id, claim })}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
