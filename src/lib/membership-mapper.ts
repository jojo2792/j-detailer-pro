import type {
  Membership,
  MembershipHistoryEntry,
  MembershipPlan,
  PlanChangeKind,
} from "@/types/membership";

type Row = Record<string, unknown>;

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export function mapPlan(row: Row): MembershipPlan {
  return {
    id: String(row["id"]),
    slug: String(row["slug"]),
    name: String(row["name"]),
    tagline: (row["tagline"] as string | null) ?? null,
    monthlyPriceCents: Number(row["monthly_price_cents"] ?? 0),
    currency: String(row["currency"] ?? "TTD"),
    monthlyWashLimit: Number(row["monthly_wash_limit"] ?? 0),
    monthlyInteriorLimit: Number(row["monthly_interior_limit"] ?? 0),
    discountPercentage: Number(row["discount_percentage"] ?? 0),
    rewardMultiplier: Number(row["reward_multiplier"] ?? 1),
    vehicleLimit: Number(row["vehicle_limit"] ?? 1),
    features: asStringArray(row["features"]),
    limits: asStringArray(row["limits"]),
    tierRank: Number(row["tier_rank"] ?? 0),
    isFeatured: Boolean(row["is_featured"]),
    requiresQuote: Boolean(row["requires_quote"]),
  };
}

export function mapMembership(row: Row, plan: MembershipPlan, pendingPlan: MembershipPlan | null): Membership {
  const washesUsed = Number(row["washes_used"] ?? 0);
  const interiorUsed = Number(row["interior_details_used"] ?? 0);
  const renewalDate = String(row["renewal_date"]);
  const msLeft = new Date(renewalDate).getTime() - Date.now();

  return {
    id: String(row["id"]),
    status: row["status"] as Membership["status"],
    autoRenew: Boolean(row["auto_renew"]),
    startedAt: String(row["started_at"]),
    currentPeriodStart: String(row["current_period_start"]),
    currentPeriodEnd: String(row["current_period_end"]),
    renewalDate,
    cancelAtPeriodEnd: Boolean(row["cancel_at_period_end"]),
    pausedAt: (row["paused_at"] as string | null) ?? null,
    cancelledAt: (row["cancelled_at"] as string | null) ?? null,
    plan,
    pendingPlan,
    usage: {
      washesUsed,
      monthlyWashLimit: plan.monthlyWashLimit,
      washesRemaining: Math.max(plan.monthlyWashLimit - washesUsed, 0),
      interiorUsed,
      monthlyInteriorLimit: plan.monthlyInteriorLimit,
      interiorRemaining: Math.max(plan.monthlyInteriorLimit - interiorUsed, 0),
    },
    daysUntilRenewal: Math.max(Math.ceil(msLeft / 86_400_000), 0),
  };
}

export function mapHistory(row: Row, planNames: Map<string, string>): MembershipHistoryEntry {
  const from = row["from_plan_id"] as string | null;
  const to = row["to_plan_id"] as string | null;
  return {
    id: String(row["id"]),
    event: row["event"] as MembershipHistoryEntry["event"],
    note: (row["note"] as string | null) ?? null,
    createdAt: String(row["created_at"]),
    fromPlanName: from ? (planNames.get(from) ?? null) : null,
    toPlanName: to ? (planNames.get(to) ?? null) : null,
    metadata: (row["metadata"] as Record<string, unknown>) ?? {},
  };
}

export function comparePlans(current: MembershipPlan, next: MembershipPlan): PlanChangeKind {
  if (next.tierRank === current.tierRank) return "same";
  return next.tierRank > current.tierRank ? "upgrade" : "downgrade";
}