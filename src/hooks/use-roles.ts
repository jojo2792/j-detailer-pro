import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { rolesService, staffDirectoryQuery } from "@/services/roles.service";
import type { AppRole } from "@/types/admin";

export function useStaffDirectory(search: string, enabled: boolean) {
  return useQuery(staffDirectoryQuery(search, enabled));
}

export function useSetStaffRole() {
  const queryClient = useQueryClient();
  const setRole = useServerFn(rolesService.setStaffRole);

  return useMutation({
    mutationFn: (input: { userId: string; role: AppRole; grant: boolean }) => setRole({ data: input }),
    onSuccess: (_result, input) => {
      toast.success(input.grant ? `Granted ${input.role} access.` : `Removed ${input.role} access.`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "access"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Couldn't update that role."),
  });
}
