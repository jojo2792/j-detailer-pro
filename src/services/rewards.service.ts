import { queryOptions } from "@tanstack/react-query";
import {
  getMyRewards,
  listRewardCatalog,
  listRewardEarnRates,
  redeemMyReward,
} from "@/lib/rewards.functions";

export const rewardKeys = {
  earnRates: ["rewards", "earn-rates"] as const,
  catalog: ["rewards", "catalog"] as const,
  mine: ["rewards", "mine"] as const,
};

export const earnRatesQuery = () =>
  queryOptions({
    queryKey: rewardKeys.earnRates,
    queryFn: () => listRewardEarnRates(),
    staleTime: 5 * 60 * 1000,
  });

export const rewardCatalogQuery = () =>
  queryOptions({
    queryKey: rewardKeys.catalog,
    queryFn: () => listRewardCatalog(),
    staleTime: 5 * 60 * 1000,
  });

export const myRewardsQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: rewardKeys.mine,
    queryFn: () => getMyRewards(),
    enabled,
  });

export const rewardsService = { redeem: redeemMyReward };
