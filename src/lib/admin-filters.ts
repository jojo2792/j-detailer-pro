import type { AdminMemberFilters, MemberSortKey } from "@/types/admin";
import type { MembershipStatus } from "@/types/membership";

export const MEMBER_STATUSES: MembershipStatus[] = [
  "pending",
  "active",
  "paused",
  "cancelled",
  "expired",
];

export const MEMBER_SORTS: { value: MemberSortKey; label: string }[] = [
  { value: "name", label: "Customer" },
  { value: "plan", label: "Plan" },
  { value: "status", label: "Status" },
  { value: "renewal", label: "Renewal date" },
  { value: "started", label: "Joined" },
  { value: "price", label: "Monthly value" },
];

export const defaultMemberFilters: AdminMemberFilters = {
  search: "",
  statuses: [],
  planSlugs: [],
  from: null,
  to: null,
  autoRenew: "any",
  sort: "renewal",
  dir: "asc",
  page: 1,
  pageSize: 25,
};

export function activeFilterCount(filters: AdminMemberFilters): number {
  let count = 0;
  if (filters.search.trim()) count += 1;
  if (filters.statuses.length) count += 1;
  if (filters.planSlugs.length) count += 1;
  if (filters.from || filters.to) count += 1;
  if (filters.autoRenew !== "any") count += 1;
  return count;
}