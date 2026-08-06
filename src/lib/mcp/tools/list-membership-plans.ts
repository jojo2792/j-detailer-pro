import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_membership_plans",
  title: "List membership plans",
  description: "List J The Detailer membership plans with pricing, monthly limits and perks.",
  inputSchema: {
    include_inactive: z.boolean().optional().describe("Include plans that are no longer offered."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ include_inactive }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("membership_plans")
      .select(
        "slug,name,tagline,monthly_price_cents,currency,monthly_wash_limit,monthly_interior_limit,vehicle_limit,discount_percentage,reward_multiplier,requires_quote,is_featured,is_active,tier_rank",
      )
      .order("tier_rank", { ascending: true });
    if (!include_inactive) query = query.eq("is_active", true);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const plans = (data ?? []).map((plan) => ({
      ...plan,
      monthly_price: `${plan.currency} ${(plan.monthly_price_cents / 100).toFixed(2)}`,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(plans, null, 2) }],
      structuredContent: { plans },
    };
  },
});
