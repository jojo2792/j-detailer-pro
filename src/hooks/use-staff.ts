import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { staffAccessQuery, staffBoardQuery, staffKeys, staffService } from "@/services/staff.service";
import type { BookingStatus } from "@/types/booking";
import type { StaffScope } from "@/types/staff";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function useStaffAccess() {
  const query = useQuery(staffAccessQuery());
  return {
    access: query.data ?? null,
    isStaff: Boolean(query.data?.isStaff),
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useStaffBoard(scope: StaffScope, enabled: boolean) {
  return useQuery(staffBoardQuery(scope, enabled));
}

export function useStaffJobActions(scope: StaffScope) {
  const queryClient = useQueryClient();
  const setStatus = useServerFn(staffService.setStatus);
  const setAssignment = useServerFn(staffService.setAssignment);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: staffKeys.boardRoot });
  };

  const status = useMutation({
    mutationFn: (input: { bookingId: string; status: BookingStatus }) =>
      setStatus({ data: { ...input, scope } }),
    onSuccess: (board, input) => {
      queryClient.setQueryData(staffKeys.board(scope), board);
      toast.success(
        input.status === "completed"
          ? "Job completed — customer points were awarded automatically."
          : `Appointment marked ${input.status.replace("_", " ")}.`,
      );
      refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const assignment = useMutation({
    mutationFn: (input: { bookingId: string; claim: boolean }) =>
      setAssignment({ data: { ...input, scope } }),
    onSuccess: (board, input) => {
      queryClient.setQueryData(staffKeys.board(scope), board);
      toast.success(input.claim ? "Job assigned to you." : "Job released.");
      refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return { status, assignment };
}
