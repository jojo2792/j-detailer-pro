import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { mapPlan } from "@/lib/membership-mapper";
import type { MembershipPlan, MembershipSnapshot } from "@/types/membership";

const planSlugInput = (data: unknown) => z.object({ planSlug: z.string().min(1).max(50) }).parse(data);

export const listMembershipPlans = createServerFn({ method: "GET" }).handler(
  async (): Promise<MembershipPlan[]> => {
    const { createPublicSupabaseClient } = await import("@/lib/supabase-public.server");
    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase
      .from("membership_plans")
      .select("*")
      .eq("is_active", true)
      .order("tier_rank", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapPlan);
  },
);

export const getMyMembership = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MembershipSnapshot> => {
    const { loadMembershipSnapshot } = await import("@/lib/membership.server");
    return loadMembershipSnapshot(context.supabase, context.userId);
  });

export const subscribeToPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(planSlugInput)
  .handler(async ({ data, context }): Promise<MembershipSnapshot> => {
    const { startMembership } = await import("@/lib/membership.server");
    return startMembership(context.supabase, context.userId, data.planSlug);
  });

export const changeMembershipPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(planSlugInput)
  .handler(async ({ data, context }): Promise<MembershipSnapshot> => {
    const { changePlan } = await import("@/lib/membership.server");
    return changePlan(context.supabase, context.userId, data.planSlug);
  });

export const pauseMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MembershipSnapshot> => {
    const { setPaused } = await import("@/lib/membership.server");
    return setPaused(context.supabase, context.userId, true);
  });

export const resumeMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MembershipSnapshot> => {
    const { setPaused } = await import("@/lib/membership.server");
    return setPaused(context.supabase, context.userId, false);
  });

export const cancelMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ immediate: z.boolean().default(false) }).parse(data))
  .handler(async ({ data, context }): Promise<MembershipSnapshot> => {
    const { cancel } = await import("@/lib/membership.server");
    return cancel(context.supabase, context.userId, data.immediate);
  });

export const setMembershipAutoRenew = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ autoRenew: z.boolean() }).parse(data))
  .handler(async ({ data, context }): Promise<MembershipSnapshot> => {
    const { setAutoRenew } = await import("@/lib/membership.server");
    return setAutoRenew(context.supabase, context.userId, data.autoRenew);
  });

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { loadAccount } = await import("@/lib/membership.server");
    return loadAccount(context.supabase, context.userId);
  });