/** Domain types for the membership engine. Shared by client and server. */

export type MembershipStatus = "pending" | "active" | "paused" | "cancelled" | "expired";

export type MembershipEvent =
  | "created"
  | "activated"
  | "upgraded"
  | "downgraded"
  | "paused"
  | "resumed"
  | "cancelled"
  | "renewed"
  | "cycle_reset"
  | "usage_recorded"
  | "auto_renew_changed"
  | "expired";

export interface MembershipPlan {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  monthlyPriceCents: number;
  currency: string;
  monthlyWashLimit: number;
  monthlyInteriorLimit: number;
  discountPercentage: number;
  rewardMultiplier: number;
  vehicleLimit: number;
  features: string[];
  limits: string[];
  tierRank: number;
  isFeatured: boolean;
  requiresQuote: boolean;
}

export interface MembershipUsage {
  washesUsed: number;
  washesRemaining: number;
  monthlyWashLimit: number;
  interiorUsed: number;
  interiorRemaining: number;
  monthlyInteriorLimit: number;
}

export interface Membership {
  id: string;
  status: MembershipStatus;
  autoRenew: boolean;
  startedAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  renewalDate: string;
  cancelAtPeriodEnd: boolean;
  pausedAt: string | null;
  cancelledAt: string | null;
  plan: MembershipPlan;
  pendingPlan: MembershipPlan | null;
  usage: MembershipUsage;
  daysUntilRenewal: number;
}

export interface MembershipHistoryEntry {
  id: string;
  event: MembershipEvent;
  note: string | null;
  createdAt: string;
  fromPlanName: string | null;
  toPlanName: string | null;
  metadata: Record<string, unknown>;
}

export interface MembershipSnapshot {
  membership: Membership | null;
  history: MembershipHistoryEntry[];
}

export type PlanChangeKind = "upgrade" | "downgrade" | "same";