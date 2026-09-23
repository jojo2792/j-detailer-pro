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
  onStatus: (status: BookingStatus) => void;
  onAssign: (claim: boolean) => void;
}

export function StaffJobCard({ job, busy, onStatus, onAssign }: Props) {
  const [open, setOpen] = useState(false);
  const actions = NEXT_ACTIONS[job.status];
  const canCancel = job.status === "pending" || job.status === "confirmed" || job.status === "in_progress";

  return (
    <li className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
              {STATUS_LABEL[job.status]}
            </span>
            <span className="text-xs text-muted-foreground">#{job.reference}</span>
            {job.assignedToMe && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
                <UserCheck className="h-3 w-3" aria-hidden /> Yours
              </span>
            )}
          </div>
          <h3 className="mt-2 font-display text-lg font-bold">{job.serviceName}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden /> {formatDateTime(job.scheduledAt)} ·{" "}
              {job.durationMinutes} min
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-widest hover:border-primary hover:text-primary"
        >
          Details
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
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
            <div className="flex items-start gap-2 rounded-xl border border-border bg-background/40 p-3 text-muted-foreground">
              <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              <span>{job.notes}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.status}
            type="button"
            disabled={busy}
            onClick={() => onStatus(action.status)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-gold disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            )}
            {action.label}
          </button>
        ))}

        {job.status !== "completed" && job.status !== "cancelled" && (
          <button
            type="button"
            disabled={busy || (Boolean(job.technicianId) && !job.assignedToMe)}
            onClick={() => onAssign(!job.assignedToMe)}
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs font-semibold uppercase tracking-widest hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserCheck className="h-3.5 w-3.5" aria-hidden />
            {job.assignedToMe ? "Release" : job.technicianId ? "Assigned" : "Claim job"}
          </button>
        )}

        {canCancel && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onStatus("cancelled")}
            className="inline-flex items-center gap-2 rounded-full border border-destructive/40 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-destructive hover:bg-destructive/10 disabled:opacity-60"
          >
            <XCircle className="h-3.5 w-3.5" aria-hidden /> Cancel
          </button>
        )}
      </div>
    </li>
  );
}
