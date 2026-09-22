import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { MyRewards, RewardCatalogItem, RewardEarnRate } from "@/types/rewards";

export const listRewardEarnRates = createServerFn({ method: "GET" }).handler(
  async (): Promise<RewardEarnRate[]> => {
    const { createPublicSupabaseClient } = await import("@/lib/supabase-public.server");
    const { loadEarnRates } = await import("@/lib/rewards.server");
    return loadEarnRates(createPublicSupabaseClient());
  },
);

export const listRewardCatalog = createServerFn({ method: "GET" }).handler(
  async (): Promise<RewardCatalogItem[]> => {
    const { createPublicSupabaseClient } = await import("@/lib/supabase-public.server");
    const { loadCatalog } = await import("@/lib/rewards.server");
    return loadCatalog(createPublicSupabaseClient());
  },
);

export const getMyRewards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyRewards> => {
    const { loadMyRewards } = await import("@/lib/rewards.server");
    return loadMyRewards(context.supabase, context.userId);
  });

export const redeemMyReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ catalogId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<number> => {
    const { redeemReward } = await import("@/lib/rewards.server");
    return redeemReward(context.supabase, data.catalogId);
  });
