import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { comparePlans, mapHistory, mapMembership, mapPlan } from "@/lib/membership-mapper";
import type { MembershipPlan, MembershipSnapshot } from "@/types/membership";

type Client = SupabaseClient<Database>;
type MembershipRow = Database["public"]["Tables"]["memberships"]["Row"];
type PlanRow = Database["public"]["Tables"]["membership_plans"]["Row"];
type EventName = Database["public"]["Enums"]["membership_event"];

const LIVE = ["pending", "active", "paused"] as const;

function fail(message: string): never {
  throw new Error(message);
}

async function logEvent(
  membershipId: string,
  event: EventName,
  options: {
    fromPlanId?: string | null;
    toPlanId?: string | null;
    note?: string;
    metadata?: Record<string, unknown>;
  } = {},
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.rpc("log_membership_event", {
    _membership_id: membershipId,
    _event: event,
    _from_plan_id: options.fromPlanId ?? undefined,
    _to_plan_id: options.toPlanId ?? undefined,
    _note: options.note ?? undefined,
    _metadata: (options.metadata ?? {}) as never,
  });
  if (error) console.error("[membership] failed to log event", event, error.message);
}

/** Rolls elapsed billing cycles forward. Runs with service role after ownership is proven. */
async function syncCycle(membershipId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.rpc("sync_membership_cycle", {
    _membership_id: membershipId,
  });
  if (error) console.error("[membership] cycle sync failed", error.message);
}

async function fetchPlans(supabase: Client): Promise<PlanRow[]> {
  const { data, error } = await supabase.from("membership_plans").select("*");
  if (error) fail(error.message);
  return data ?? [];
}

async function fetchLiveMembership(supabase: Client, userId: string): Promise<MembershipRow | null> {
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("user_id", userId)
    .in("status", [...LIVE])
    .maybeSingle();
  if (error) fail(error.message);
  return data ?? null;
}

async function fetchLatestMembership(supabase: Client, userId: string): Promise<MembershipRow | null> {
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) fail(error.message);
  return data ?? null;
}

export async function loadMembershipSnapshot(
  supabase: Client,
  userId: string,
): Promise<MembershipSnapshot> {
  let row = (await fetchLiveMembership(supabase, userId)) ?? (await fetchLatestMembership(supabase, userId));

  if (row && LIVE.includes(row.status as (typeof LIVE)[number]) && new Date(row.current_period_end) <= new Date()) {
    await syncCycle(row.id);
    row = (await fetchLiveMembership(supabase, userId)) ?? (await fetchLatestMembership(supabase, userId));
  }

  const planRows = await fetchPlans(supabase);
  const planNames = new Map(planRows.map((p) => [p.id, p.name]));

  const { data: historyRows, error: historyError } = await supabase
    .from("membership_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (historyError) fail(historyError.message);

  let membership: MembershipSnapshot["membership"] = null;
  if (row) {
    const planRow = planRows.find((p) => p.id === row.plan_id);
    if (planRow) {
      const pendingRow = row.pending_plan_id
        ? (planRows.find((p) => p.id === row.pending_plan_id) ?? null)
        : null;
      membership = mapMembership(row, mapPlan(planRow), pendingRow ? mapPlan(pendingRow) : null);
    }
  }

  return {
    membership,
    history: (historyRows ?? []).map((h) => mapHistory(h, planNames)),
  };
}

async function requirePlan(supabase: Client, slug: string): Promise<PlanRow> {
  const { data, error } = await supabase
    .from("membership_plans")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) fail(error.message);
  if (!data) fail("That membership plan is unavailable.");
  if (data.requires_quote) fail("The Fleet plan is quote-based — request a quote instead.");
  return data;
}

export async function startMembership(
  supabase: Client,
  userId: string,
  planSlug: string,
): Promise<MembershipSnapshot> {
  const existing = await fetchLiveMembership(supabase, userId);
  if (existing) fail("You already have an active membership. Change your plan instead.");

  const plan = await requirePlan(supabase, planSlug);
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { data, error } = await supabase
    .from("memberships")
    .insert({
      user_id: userId,
      plan_id: plan.id,
      status: "active",
      auto_renew: true,
      started_at: now.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      renewal_date: periodEnd.toISOString(),
    })
    .select("id")
    .single();
  if (error) fail(error.message);

  await logEvent(data.id, "created", { toPlanId: plan.id, note: `Joined the ${plan.name} plan` });
  return loadMembershipSnapshot(supabase, userId);
}

export async function changePlan(
  supabase: Client,
  userId: string,
  planSlug: string,
): Promise<MembershipSnapshot> {
  const row = await fetchLiveMembership(supabase, userId);
  if (!row) fail("You don't have an active membership yet.");

  const nextPlanRow = await requirePlan(supabase, planSlug);
  const planRows = await fetchPlans(supabase);
  const currentPlanRow = planRows.find((p) => p.id === row.plan_id);
  if (!currentPlanRow) fail("Current plan could not be resolved.");

  const current: MembershipPlan = mapPlan(currentPlanRow);
  const next: MembershipPlan = mapPlan(nextPlanRow);
  const kind = comparePlans(current, next);
  if (kind === "same") fail("You're already on that plan.");

  if (kind === "upgrade") {
    // Upgrades apply immediately: allowances only grow, so usage carries over.
    const { error } = await supabase
      .from("memberships")
      .update({ plan_id: next.id, pending_plan_id: null, status: "active" })
      .eq("id", row.id);
    if (error) fail(error.message);
    await logEvent(row.id, "upgraded", {
      fromPlanId: current.id,
      toPlanId: next.id,
      note: `Upgraded from ${current.name} to ${next.name}`,
    });
  } else {
    // Downgrades take effect at renewal so the paid-for allowance is honoured.
    const { error } = await supabase
      .from("memberships")
      .update({ pending_plan_id: next.id })
      .eq("id", row.id);
    if (error) fail(error.message);
    await logEvent(row.id, "downgraded", {
      fromPlanId: current.id,
      toPlanId: next.id,
      note: `Downgrade to ${next.name} scheduled for the next renewal`,
    });
  }

  return loadMembershipSnapshot(supabase, userId);
}

export async function setPaused(
  supabase: Client,
  userId: string,
  paused: boolean,
): Promise<MembershipSnapshot> {
  const row = await fetchLiveMembership(supabase, userId);
  if (!row) fail("You don't have an active membership yet.");

  if (paused) {
    if (row.status !== "active") fail("Only an active membership can be paused.");
    const { error } = await supabase
      .from("memberships")
      .update({ status: "paused", paused_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) fail(error.message);
    await logEvent(row.id, "paused", { note: "Membership paused by the member" });
  } else {
    if (row.status !== "paused") fail("This membership isn't paused.");
    // Credit the paused days back onto the current billing period.
    const pausedMs = row.paused_at ? Date.now() - new Date(row.paused_at).getTime() : 0;
    const periodEnd = new Date(new Date(row.current_period_end).getTime() + pausedMs).toISOString();
    const { error } = await supabase
      .from("memberships")
      .update({
        status: "active",
        paused_at: null,
        resumes_at: new Date().toISOString(),
        current_period_end: periodEnd,
        renewal_date: periodEnd,
      })
      .eq("id", row.id);
    if (error) fail(error.message);
    await logEvent(row.id, "resumed", {
      note: "Membership resumed",
      metadata: { paused_days: Math.round(pausedMs / 86_400_000) },
    });
  }

  return loadMembershipSnapshot(supabase, userId);
}

export async function cancel(
  supabase: Client,
  userId: string,
  immediate: boolean,
): Promise<MembershipSnapshot> {
  const row = await fetchLiveMembership(supabase, userId);
  if (!row) fail("You don't have an active membership to cancel.");

  const payload = immediate
    ? {
        status: "cancelled" as const,
        cancelled_at: new Date().toISOString(),
        auto_renew: false,
        cancel_at_period_end: false,
        pending_plan_id: null,
      }
    : { cancel_at_period_end: true, auto_renew: false, pending_plan_id: null };

  const { error } = await supabase.from("memberships").update(payload).eq("id", row.id);
  if (error) fail(error.message);

  await logEvent(row.id, "cancelled", {
    note: immediate
      ? "Membership cancelled immediately"
      : `Membership will end on ${new Date(row.current_period_end).toDateString()}`,
    metadata: { immediate },
  });

  return loadMembershipSnapshot(supabase, userId);
}

export async function setAutoRenew(
  supabase: Client,
  userId: string,
  autoRenew: boolean,
): Promise<MembershipSnapshot> {
  const row = await fetchLiveMembership(supabase, userId);
  if (!row) fail("You don't have an active membership yet.");

  const { error } = await supabase
    .from("memberships")
    .update({ auto_renew: autoRenew, cancel_at_period_end: autoRenew ? false : row.cancel_at_period_end })
    .eq("id", row.id);
  if (error) fail(error.message);

  await logEvent(row.id, "auto_renew_changed", {
    note: autoRenew ? "Auto renewal turned on" : "Auto renewal turned off",
    metadata: { auto_renew: autoRenew },
  });

  return loadMembershipSnapshot(supabase, userId);
}

export async function loadAccount(supabase: Client, userId: string) {
  const [profileResult, rolesResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);
  if (profileResult.error) fail(profileResult.error.message);
  if (rolesResult.error) fail(rolesResult.error.message);

  return {
    profile: {
      id: userId,
      fullName: profileResult.data?.full_name ?? null,
      email: profileResult.data?.email ?? null,
      phone: profileResult.data?.phone ?? null,
    },
    roles: (rolesResult.data ?? []).map((r) => r.role as "customer" | "technician" | "admin"),
  };
}