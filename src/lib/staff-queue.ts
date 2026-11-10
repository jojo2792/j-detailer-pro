import type { BookingStatus } from "@/types/booking";
import type { StaffJob } from "@/types/staff";

export const QUEUE_STATUSES: { value: BookingStatus; label: string }[] = [
  { value: "in_progress", label: "In progress" },
  { value: "pending", label: "Awaiting confirmation" },
  { value: "confirmed", label: "Ready to start" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export type AssignmentFilter = "all" | "unassigned" | "mine";

export function isOpenJob(job: StaffJob): boolean {
  return job.status === "pending" || job.status === "confirmed" || job.status === "in_progress";
}

/** The scheduled start has passed, not an assertion that a technician is late. */
export function hasPassedStart(job: StaffJob, now: number): boolean {
  return (job.status === "pending" || job.status === "confirmed") &&
    new Date(job.scheduledAt).getTime() < now;
}

export function filterStaffJobs(jobs: StaffJob[], search: string, assignment: AssignmentFilter): StaffJob[] {
  const terms = search.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return jobs.filter((job) => {
    if (assignment === "unassigned" && job.technicianId) return false;
    if (assignment === "mine" && !job.assignedToMe) return false;
    const text = [job.reference, job.contactName, job.serviceName, job.vehicleDetail,
      job.vehicleSummary, job.city].filter(Boolean).join(" ").toLocaleLowerCase();
    return terms.every((term) => text.includes(term));
  }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
}

export function groupStaffJobs(jobs: StaffJob[]) {
  return QUEUE_STATUSES.map((status) => ({ ...status, jobs: jobs.filter((job) => job.status === status.value) }));
}

export interface TechnicianWorkload {
  technicianId: string | null;
  assignedToMe: boolean;
  queued: number;
  inProgress: number;
  scheduledMinutes: number;
}

/** Scoped to loaded open jobs; no directory reads, inferred names or capacity estimates. */
export function technicianWorkload(jobs: StaffJob[]): TechnicianWorkload[] {
  const rows = new Map<string | null, TechnicianWorkload>();
  for (const job of jobs) {
    if (!isOpenJob(job)) continue;
    const row = rows.get(job.technicianId) ?? {
      technicianId: job.technicianId, assignedToMe: job.assignedToMe,
      queued: 0, inProgress: 0, scheduledMinutes: 0,
    };
    if (job.status === "in_progress") row.inProgress += 1;
    else row.queued += 1;
    row.scheduledMinutes += job.durationMinutes;
    rows.set(job.technicianId, row);
  }
  return [...rows.values()].sort((a, b) =>
    Number(b.assignedToMe) - Number(a.assignedToMe) ||
    Number(Boolean(a.technicianId)) - Number(Boolean(b.technicianId)) ||
    (a.technicianId ?? "").localeCompare(b.technicianId ?? ""));
}

export function technicianLabel(technicianId: string | null, assignedToMe: boolean): string {
  if (!technicianId) return "Unassigned";
  return assignedToMe ? "You" : `Technician ${technicianId.slice(0, 8)}…${technicianId.slice(-4)}`;
}