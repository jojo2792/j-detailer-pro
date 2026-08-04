import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminAccessQuery, adminMembersQuery, adminOverviewQuery, adminService } from "@/services/admin.service";
import { defaultMemberFilters } from "@/lib/admin-filters";
import type { AdminMemberFilters } from "@/types/admin";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function useAdminAccess() {
  const query = useQuery(adminAccessQuery());
  return {
    access: query.data ?? null,
    permissions: query.data?.permissions ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useMemberFilters() {
  const [filters, setFilters] = useState<AdminMemberFilters>(defaultMemberFilters);

  const update = useCallback((patch: Partial<AdminMemberFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...patch,
      page: "page" in patch ? (patch.page ?? 1) : 1,
    }));
  }, []);

  const reset = useCallback(() => setFilters(defaultMemberFilters), []);

  return { filters, update, reset };
}

export function useAdminOverview(enabled: boolean) {
  return useQuery(adminOverviewQuery(enabled));
}

export function useAdminMembers(filters: AdminMemberFilters, enabled: boolean) {
  return useQuery(adminMembersQuery(filters, enabled));
}

export function useMemberExport(filters: AdminMemberFilters) {
  const exportMembers = useServerFn(adminService.exportMembers);

  return useMutation({
    mutationFn: () => exportMembers({ data: filters }),
    onSuccess: (result) => {
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${result.rowCount} member${result.rowCount === 1 ? "" : "s"}.`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function usePagination(page: number, pageCount: number) {
  return useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, Math.min(page - 2, pageCount - 4));
    for (let i = start; i < start + 5 && i <= pageCount; i += 1) pages.push(i);
    return pages.filter((p) => p >= 1);
  }, [page, pageCount]);
}