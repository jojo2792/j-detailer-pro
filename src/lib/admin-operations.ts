import type { AdminMemberRow } from "@/types/admin";
import type { StaffJob } from "@/types/staff";
import { isOpenJob } from "./staff-queue";

export function bookingSummary(jobs: StaffJob[]) {
  return {
    loaded: jobs.length,
    open: jobs.filter(isOpenJob).length,
    pending: jobs.filter((job) => job.status === "pending").length,
    confirmed: jobs.filter((job) => job.status === "confirmed").length,
    inProgress: jobs.filter((job) => job.status === "in_progress").length,
    completed: jobs.filter((job) => job.status === "completed").length,
    unassigned: jobs.filter((job) => isOpenJob(job) && !job.technicianId).length,
  };
}

/** Only the current filtered page, never all customers or all renewals. */
export function memberPageActivity(rows: AdminMemberRow[], now: number) {
  const end = now + 7 * 86_400_000;
  return {
    customers: new Set(rows.map((row) => row.userId)).size,
    renewing: rows.filter((row) => row.status === "active" &&
      new Date(row.renewalDate).getTime() >= now && new Date(row.renewalDate).getTime() < end).length,
    ending: rows.filter((row) => row.status === "active" && row.cancelAtPeriodEnd).length,
  };
}