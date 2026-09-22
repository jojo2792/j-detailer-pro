export type RewardKind = "earn" | "redeem" | "adjustment";

export interface RewardTransaction {
  id: string;
  kind: RewardKind;
  points: number;
  description: string;
  multiplier: number;
  createdAt: string;
}

export interface RewardCatalogItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  pointsCost: number;
}

export interface RewardEarnRate {
  slug: string;
  name: string;
  points: number;
}

export interface MyRewards {
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  multiplier: number;
  planName: string | null;
  transactions: RewardTransaction[];
}
