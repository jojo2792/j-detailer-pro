/** Domain types for the admin CRM. Shared by client and server. */
import type { MembershipStatus } from "@/types/membership";

export type AppRole = "customer" | "technician" | "admin";

export interface AdminPermissions {
  canViewMembers: boolean;
  canViewRevenue: boolean;
  canExport: boolean;
  canManageMembers: boolean;
}

export interface AdminAccess {
  roles: AppRole[];
  permissions: AdminPermissions;
}

export interface RevenuePoint {
  month: string;
  label: string;
  revenueCents: number;
  newMembers: number;
  churned: number;
}

export interface AdminKpis {
  mrrCents: number;
  arpuCents: number;
  activeMembers: number;
  pausedMembers: number;
  cancelledMembers: number;
  totalMembers: number;
  newThisMonth: number;
  churnedThisMonth: number;
  churnRatePct: number;
  autoRenewPct: number;
}

export interface PlanMixRow {
  planSlug: string;
  planName: string;
  members: number;
  mrrCents: number;
}

export interface AdminOverview {
  kpis: AdminKpis;
  revenue: RevenuePoint[];
  planMix: PlanMixRow[];
  generatedAt: string;
}

export type MemberSortKey = "name" | "plan" | "status" | "renewal" | "started" | "price";

export interface AdminMemberFilters {
  search: string;
  statuses: MembershipStatus[];
  planSlugs: string[];
  from: string | null;
  to: string | null;
  autoRenew: "any" | "on" | "off";
  sort: MemberSortKey;
  dir: "asc" | "desc";
  page: number;
  pageSize: number;
}

export interface AdminMemberRow {
  membershipId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  planSlug: string;
  planName: string;
  priceCents: number;
  status: MembershipStatus;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  startedAt: string;
  renewalDate: string;
  washesUsed: number;
  washLimit: number;
  interiorUsed: number;
  interiorLimit: number;
}

export interface AdminMembersPage {
  rows: AdminMemberRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
export interface StaffMemberRow {
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  roles: AppRole[];
  joinedAt: string;
  isSelf: boolean;
}

export interface StaffDirectory {
  rows: StaffMemberRow[];
  counts: Record<AppRole, number>;
}
