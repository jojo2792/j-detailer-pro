import { queryOptions } from "@tanstack/react-query";
import { getAdminAccess, getAdminMembers, getAdminOverview, exportAdminMembers } from "@/lib/admin.functions";
import type { AdminMemberFilters } from "@/types/admin";

export const adminKeys = {
  access: ["admin", "access"] as const,
  overview: ["admin", "overview"] as const,
  members: (filters: AdminMemberFilters) => ["admin", "members", filters] as const,
};

export const adminAccessQuery = () =>
  queryOptions({
    queryKey: adminKeys.access,
    queryFn: () => getAdminAccess(),
    staleTime: 5 * 60 * 1000,
  });

export const adminOverviewQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: adminKeys.overview,
    queryFn: () => getAdminOverview(),
    enabled,
    staleTime: 60 * 1000,
  });

export const adminMembersQuery = (filters: AdminMemberFilters, enabled: boolean) =>
  queryOptions({
    queryKey: adminKeys.members(filters),
    queryFn: () => getAdminMembers({ data: filters }),
    enabled,
    staleTime: 30 * 1000,
  });

export const adminService = {
  exportMembers: exportAdminMembers,
};