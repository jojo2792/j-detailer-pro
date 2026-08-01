import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  membershipKeys,
  membershipPlansQuery,
  membershipService,
  myMembershipQuery,
} from "@/services/membership.service";
import type { MembershipSnapshot } from "@/types/membership";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function useMembershipPlans() {
  return useQuery(membershipPlansQuery());
}

export function useMembership() {
  const queryClient = useQueryClient();
  const query = useQuery(myMembershipQuery());

  const subscribe = useServerFn(membershipService.subscribe);
  const changePlan = useServerFn(membershipService.changePlan);
  const pause = useServerFn(membershipService.pause);
  const resume = useServerFn(membershipService.resume);
  const cancel = useServerFn(membershipService.cancel);
  const setAutoRenew = useServerFn(membershipService.setAutoRenew);

  function onSuccess(message: string) {
    return (snapshot: MembershipSnapshot) => {
      queryClient.setQueryData(membershipKeys.mine, snapshot);
      toast.success(message);
    };
  }

  function onError(error: unknown) {
    toast.error(errorMessage(error));
  }

  const subscribeMutation = useMutation({
    mutationFn: (planSlug: string) => subscribe({ data: { planSlug } }),
    onSuccess: onSuccess("Welcome aboard — your membership is active."),
    onError,
  });

  const changePlanMutation = useMutation({
    mutationFn: (planSlug: string) => changePlan({ data: { planSlug } }),
    onSuccess: onSuccess("Plan change saved."),
    onError,
  });

  const pauseMutation = useMutation({
    mutationFn: () => pause(),
    onSuccess: onSuccess("Membership paused."),
    onError,
  });

  const resumeMutation = useMutation({
    mutationFn: () => resume(),
    onSuccess: onSuccess("Membership resumed."),
    onError,
  });

  const cancelMutation = useMutation({
    mutationFn: (immediate: boolean) => cancel({ data: { immediate } }),
    onSuccess: onSuccess("Cancellation recorded."),
    onError,
  });

  const autoRenewMutation = useMutation({
    mutationFn: (autoRenew: boolean) => setAutoRenew({ data: { autoRenew } }),
    onSuccess: onSuccess("Renewal preference updated."),
    onError,
  });

  const isMutating =
    subscribeMutation.isPending ||
    changePlanMutation.isPending ||
    pauseMutation.isPending ||
    resumeMutation.isPending ||
    cancelMutation.isPending ||
    autoRenewMutation.isPending;

  return {
    membership: query.data?.membership ?? null,
    history: query.data?.history ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isMutating,
    subscribe: subscribeMutation.mutate,
    changePlan: changePlanMutation.mutate,
    pause: pauseMutation.mutate,
    resume: resumeMutation.mutate,
    cancel: cancelMutation.mutate,
    setAutoRenew: autoRenewMutation.mutate,
  };
}