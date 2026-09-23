import { queryOptions } from "@tanstack/react-query";
import {
  getStaffAccess,
  getStaffBoard,
  setStaffJobAssignment,
  setStaffJobStatus,
} from "@/lib/staff.functions";
import type { StaffScope } from "@/types/staff";

export const staffKeys = {
  access: ["staff", "access"] as const,
  board: (scope: StaffScope) => ["staff", "board", scope] as const,
  boardRoot: ["staff", "board"] as const,
};

export const staffAccessQuery = () =>
  queryOptions({
    queryKey: staffKeys.access,
    queryFn: () => getStaffAccess(),
    staleTime: 60 * 1000,
  });

export const staffBoardQuery = (scope: StaffScope, enabled: boolean) =>
  queryOptions({
    queryKey: staffKeys.board(scope),
    queryFn: () => getStaffBoard({ data: { scope } }),
    enabled,
  });

export const staffService = {
  setStatus: setStaffJobStatus,
  setAssignment: setStaffJobAssignment,
};
