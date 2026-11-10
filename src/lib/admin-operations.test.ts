import { expect, it } from "vitest";
import type { AdminMemberRow } from "@/types/admin";
import type { StaffJob } from "@/types/staff";
import { bookingSummary, memberPageActivity } from "./admin-operations";

it("summarizes only supplied bookings with existing status and assignment values", () => {
  const jobs = ["pending", "confirmed", "in_progress", "completed", "cancelled"].map((status, i) =>
    ({ status, technicianId: i === 1 ? "assigned" : null } as StaffJob));
  expect(bookingSummary(jobs)).toEqual({ loaded: 5, open: 3, pending: 1, confirmed: 1,
    inProgress: 1, completed: 1, unassigned: 2 });
  expect(bookingSummary([]).loaded).toBe(0);
});

it("counts unique customers and active scheduled renewals only on supplied page in a seven-day window", () => {
  const now = Date.parse("2026-11-10T04:00:00Z");
  const row = (userId: string, renewalDate: string, status = "active", cancelAtPeriodEnd = false) =>
    ({ userId, renewalDate, status, cancelAtPeriodEnd } as AdminMemberRow);
  expect(memberPageActivity([
    row("one", "2026-11-10T00:00:00-04:00", "active", true),
    row("one", "2026-11-11T04:00:00Z"),
    row("two", "2026-11-09T04:00:00Z"),
    row("three", "2026-11-17T04:00:00Z"),
    row("four", "2026-11-12T04:00:00Z", "paused", true),
  ], now)).toEqual({ customers: 4, renewing: 2, ending: 1 });
  expect(memberPageActivity([], now)).toEqual({ customers: 0, renewing: 0, ending: 0 });
});