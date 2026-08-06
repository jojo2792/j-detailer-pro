import { queryOptions } from "@tanstack/react-query";
import { getStaffDirectory, setStaffRole } from "@/lib/roles.functions";

export const roleKeys = {
  directory: (search: string) => ["admin", "roles", search] as const,
};

export const staffDirectoryQuery = (search: string, enabled: boolean) =>
  queryOptions({
    queryKey: roleKeys.directory(search),
    queryFn: () => getStaffDirectory({ data: { search } }),
    enabled,
    staleTime: 30 * 1000,
  });

export const rolesService = { setStaffRole };
