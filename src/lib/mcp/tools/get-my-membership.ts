import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_membership",
  title: "Get my membership",
  description:
    "Get the signed-in member's current membership: plan, status, billing cycle, renewal date and remaining washes/interior details this cycle.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("memberships")
      .select(
        "id,status,auto_renew,cancel_at_period_end,started_at,current_period_start,current_period_end,renewal_date,paused_at,resumes_at,washes_used,interior_details_used,plan:membership_plans!memberships_plan_id_fkey(slug,name,monthly_price_cents,currency,monthly_wash_limit,monthly_interior_limit),pending_plan:membership_plans!memberships_pending_plan_id_fkey(slug,name)",
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) {
      return {
        content: [{ type: "text", text: "No membership found for this account." }],
        structuredContent: { membership: null },
      };
    }

    const plan = data.plan as { monthly_wash_limit: number; monthly_interior_limit: number } | null;
    const membership = {
      ...data,
      washes_remaining: plan ? Math.max(plan.monthly_wash_limit - data.washes_used, 0) : null,
      interior_details_remaining: plan
        ? Math.max(plan.monthly_interior_limit - data.interior_details_used, 0)
        : null,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(membership, null, 2) }],
      structuredContent: { membership },
    };
  },
});
