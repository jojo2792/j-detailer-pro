import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type {
  MyRewards,
  RewardCatalogItem,
  RewardEarnRate,
  RewardKind,
  RewardTransaction,
} from "@/types/rewards";

type Client = SupabaseClient<Database>;

function fail(message: string): never {
  throw new Error(message);
}

export async function loadEarnRates(supabase: Client): Promise<RewardEarnRate[]> {
  const { data, error } = await supabase
    .from("services")
    .select("slug, name, reward_points")
    .eq("is_active", true)
    .gt("reward_points", 0)
    .order("reward_points", { ascending: true });
  if (error) fail(error.message);
  return (data ?? []).map((row) => ({ slug: row.slug, name: row.name, points: row.reward_points }));
}

export async function loadCatalog(supabase: Client): Promise<RewardCatalogItem[]> {
  const { data, error } = await supabase
    .from("reward_catalog")
    .select("id, slug, name, description, points_cost")
    .eq("is_active", true)
    .order("points_cost", { ascending: true });
  if (error) fail(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    pointsCost: row.points_cost,
  }));
}

export async function loadMyRewards(supabase: Client, userId: string): Promise<MyRewards> {
  const { data, error } = await supabase
    .from("reward_transactions")
    .select("id, kind, points, description, multiplier, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) fail(error.message);

  const transactions: RewardTransaction[] = (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind as RewardKind,
    points: row.points,
    description: row.description,
    multiplier: Number(row.multiplier ?? 1),
    createdAt: row.created_at,
  }));

  const { data: balance, error: balanceError } = await supabase.rpc("my_reward_balance");
  if (balanceError) fail(balanceError.message);

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("status, membership_plans!memberships_plan_id_fkey(name, reward_multiplier)")
    .eq("user_id", userId)
    .in("status", ["active", "pending"])
    .maybeSingle();
  if (membershipError) fail(membershipError.message);

  const plan = membership?.membership_plans as
    | { name: string; reward_multiplier: number }
    | null
    | undefined;

  return {
    balance: Number(balance ?? 0),
    lifetimeEarned: transactions.filter((t) => t.points > 0).reduce((sum, t) => sum + t.points, 0),
    lifetimeRedeemed: transactions
      .filter((t) => t.points < 0)
      .reduce((sum, t) => sum - t.points, 0),
    multiplier: plan ? Number(plan.reward_multiplier ?? 1) : 1,
    planName: plan?.name ?? null,
    transactions,
  };
}

/** Balance and ownership are enforced inside the database function, never by the client. */
export async function redeemReward(supabase: Client, catalogId: string): Promise<number> {
  const { data, error } = await supabase.rpc("redeem_reward", { _catalog_id: catalogId });
  if (error) fail(error.message);
  return Number(data ?? 0);
}
