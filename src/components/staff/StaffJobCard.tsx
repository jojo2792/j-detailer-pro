import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  MapPin,
  Phone,
  StickyNote,
  UserCheck,
  XCircle,
} from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { technicianLabel } from "@/lib/staff-queue";
import { Button } from "@/components/ui/button";
import type { BookingStatus } from "@/types/booking";
import type { StaffJob } from "@/types/staff";

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const NEXT_ACTIONS: Record<BookingStatus, { status: BookingStatus; label: string }[]> = {
  pending: [
    { status: "confirmed", label: "Confirm" },
    { status: "in_progress", label: "Start job" },
  ],
  confirmed: [{ status: "in_progress", label: "Start job" }],
  in_progress: [{ status: "completed", label: "Mark completed" }],
  completed: [],
  cancelled: [],
};

interface Props {
  job: StaffJob;
  busy: boolean;
  startPassed?: boolean;
  onStatus: (status: BookingStatus) => void;
  onAssign: (claim: boolean) => void;
}

export function StaffJobCard({ job, busy, startPassed = false, onStatus, onAssign }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const actions = NEXT_ACTIONS[job.status];
  const canCancel = job.status === "pending" || job.status === "confirmed" || job.status === "in_progress";

  return (
    <li className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {STATUS_LABEL[job.status]}
            </span>
            <span className="text-xs text-muted-foreground">#{job.reference}</span>
            {job.assignedToMe && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                <UserCheck className="h-3 w-3" aria-hidden /> Yours
              </span>
            )}
          </div>
          <h3 className="mt-2 break-words font-display text-base font-bold">{job.serviceName}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden /> {formatDateTime(job.scheduledAt)} ·{" "}
              {job.durationMinutes} min
            </span>
          </p>
          {startPassed && <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-destructive">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden /> Scheduled start passed · Not started
          </p>}
          <p title={job.technicianId ?? undefined} className="mt-2 break-words text-xs text-muted-foreground">{technicianLabel(job.technicianId, job.assignedToMe)}</p>
          <p className="mt-1 break-words text-xs text-muted-foreground">{job.city}{(job.vehicleDetail || job.vehicleSummary) && ` · ${job.vehicleDetail ?? job.vehicleSummary}`}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={`job-details-${job.id}`}
          aria-label={`Details for booking ${job.reference}`}
        >
          Details
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        </Button>
      </div>

      {open && (
        <div id={`job-details-${job.id}`} className="mt-4 space-y-2 break-words border-t border-border pt-4 text-sm">
          <div className="font-semibold">{job.contactName}</div>
          <a
            href={`tel:${job.contactPhone}`}
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden /> {job.contactPhone}
          </a>
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(`${job.addressLine}, ${job.city}`)}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary hover:underline"
            >
              {job.addressLine}, {job.city}
            </a>
          </div>
          {(job.vehicleDetail || job.vehicleSummary) && (
            <div className="text-muted-foreground">
              Vehicle: {job.vehicleDetail ?? job.vehicleSummary}
            </div>
          )}
          {job.notes && (
            <div className="flex items-start gap-2 border-l border-border pl-3 text-muted-foreground">
              <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              <span>{job.notes}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((action) => {
          // Completing is irreversible and awards the customer's points, so it needs a second tap.
          const needsConfirm = action.status === "completed";
          return (
            <Button
              key={action.status}
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => {
                if (needsConfirm && !confirmComplete) return setConfirmComplete(true);
                setConfirmComplete(false);
                onStatus(action.status);
              }}
              onBlur={() => setConfirmComplete(false)}
              className="bg-gradient-gold text-primary-foreground"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              )}
              {needsConfirm && confirmComplete ? "Tap again to complete" : action.label}
            </Button>
          );
        })}

        {job.status !== "completed" && job.status !== "cancelled" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || (Boolean(job.technicianId) && !job.assignedToMe)}
            onClick={() => onAssign(!job.assignedToMe)}
          >
            <UserCheck className="h-3.5 w-3.5" aria-hidden />
            {job.assignedToMe ? "Release" : job.technicianId ? "Assigned" : "Claim job"}
          </Button>
        )}

        {canCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => {
              if (!confirmCancel) return setConfirmCancel(true);
              setConfirmCancel(false);
              onStatus("cancelled");
            }}
            onBlur={() => setConfirmCancel(false)}
            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <XCircle className="h-3.5 w-3.5" aria-hidden /> {confirmCancel ? "Tap again to cancel" : "Cancel"}
          </Button>
        )}
      </div>
    </li>
  );
}
