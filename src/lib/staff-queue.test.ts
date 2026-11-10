import { describe, expect, it } from "vitest";
import type { StaffJob } from "@/types/staff";
import { filterStaffJobs, groupStaffJobs, hasPassedStart, technicianWorkload } from "./staff-queue";

const now = Date.parse("2026-11-10T14:00:00Z");
function job(patch: Partial<StaffJob> = {}): StaffJob {
  return {
    id: "test", reference: "QUEUE001", status: "pending", scheduledAt: "2026-11-10T13:00:00Z",
    durationMinutes: 90, serviceName: "Exterior Detail", serviceCategory: "detailing",
    vehicleSummary: "Honda Civic", vehicleDetail: null, contactName: "Test Customer",
    contactPhone: "", addressLine: "", city: "Chaguanas", notes: null,
    technicianId: null, assignedToMe: false, ...patch,
  };
}

describe("staff queue derived from existing records", () => {
  it("groups each of the five existing statuses and counts only supplied bookings", () => {
    const groups = groupStaffJobs([job(), job({ status: "confirmed" }), job({ status: "in_progress" }),
      job({ status: "completed" }), job({ status: "cancelled" }), job({ id: "second" })]);
    expect(Object.fromEntries(groups.map((group) => [group.value, group.jobs.length]))).toEqual({
      pending: 2, confirmed: 1, in_progress: 1, completed: 1, cancelled: 1,
    });
    expect(groupStaffJobs([]).every((group) => group.jobs.length === 0)).toBe(true);
  });
  it("flags passed scheduled starts only for pending or confirmed jobs", () => {
    expect(hasPassedStart(job(), now)).toBe(true);
    expect(hasPassedStart(job({ status: "confirmed" }), now)).toBe(true);
    for (const status of ["in_progress", "completed", "cancelled"] as const) {
      expect(hasPassedStart(job({ status }), now)).toBe(false);
    }
    expect(hasPassedStart(job({ scheduledAt: "2026-11-10T14:00:00Z" }), now)).toBe(false);
    expect(hasPassedStart(job({ scheduledAt: "2026-11-10T15:00:00Z" }), now)).toBe(false);
  });
  it("compares absolute appointment times consistently across timezone offsets", () => {
    expect(hasPassedStart(job({ scheduledAt: "2026-11-10T09:00:00-04:00" }), now)).toBe(true);
    expect(hasPassedStart(job({ scheduledAt: "2026-11-10T22:00:00+09:00" }), now)).toBe(true);
  });
  it("searches supplied fields, applies assignment filters and sorts chronologically", () => {
    const mine = job({ id: "mine", technicianId: "tech-a", assignedToMe: true });
    const later = job({ id: "later", scheduledAt: "2026-11-10T15:00:00Z" });
    const other = job({ id: "other", technicianId: "tech-b", city: "Arima" });
    expect(filterStaffJobs([later, mine, other], "detail chaguanas", "all").map((j) => j.id)).toEqual(["mine", "later"]);
    expect(filterStaffJobs([mine, other, later], "QUEUE001", "unassigned").map((j) => j.id)).toEqual(["later"]);
    expect(filterStaffJobs([mine, other, later], "Honda", "mine").map((j) => j.id)).toEqual(["mine"]);
    expect(filterStaffJobs([mine], "missing", "all")).toEqual([]);
  });
  it("derives workload from assigned open jobs without counting closed work", () => {
    const workloads = technicianWorkload([
      job({ technicianId: "tech-a", assignedToMe: true }),
      job({ status: "in_progress", technicianId: "tech-a", assignedToMe: true, durationMinutes: 60 }),
      job({ status: "completed", technicianId: "tech-a", durationMinutes: 300 }),
      job({ status: "cancelled", technicianId: "tech-b" }),
      job({ status: "confirmed" }),
    ]);
    expect(workloads).toEqual([
      { technicianId: "tech-a", assignedToMe: true, queued: 1, inProgress: 1, scheduledMinutes: 150 },
      { technicianId: null, assignedToMe: false, queued: 1, inProgress: 0, scheduledMinutes: 90 },
    ]);
    expect(technicianWorkload([])).toEqual([]);
  });
});