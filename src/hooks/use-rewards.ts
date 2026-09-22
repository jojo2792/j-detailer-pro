import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  earnRatesQuery,
  myRewardsQuery,
  rewardCatalogQuery,
  rewardKeys,
  rewardsService,
} from "@/services/rewards.service";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function useRewardEarnRates() {
  return useQuery(earnRatesQuery());
}

export function useRewardCatalog() {
  return useQuery(rewardCatalogQuery());
}

export function useMyRewards(enabled: boolean) {
  return useQuery(myRewardsQuery(enabled));
}

export function useRedeemReward() {
  const queryClient = useQueryClient();
  const redeem = useServerFn(rewardsService.redeem);

  return useMutation({
    mutationFn: (catalogId: string) => redeem({ data: { catalogId } }),
    onSuccess: () => {
      toast.success("Reward redeemed — we'll apply it on your next visit.");
      void queryClient.invalidateQueries({ queryKey: rewardKeys.mine });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}
