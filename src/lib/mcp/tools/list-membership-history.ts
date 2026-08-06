import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_membership_history",
  title: "List membership history",
  description:
    "List the signed-in member's membership lifecycle events (subscribed, plan changes, pauses, renewals, cancellations), newest first.",
  inputSchema: {
    limit: z.number().int().optional().describe("How many events to return (1-50, default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const take = Math.min(Math.max(limit ?? 20, 1), 50);
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("membership_history")
      .select(
        "created_at,event,note,from_plan:membership_plans!membership_history_from_plan_id_fkey(slug,name),to_plan:membership_plans!membership_history_to_plan_id_fkey(slug,name)",
      )
      .order("created_at", { ascending: false })
      .limit(take);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const events = data ?? [];
    return {
      content: [{ type: "text", text: JSON.stringify(events, null, 2) }],
      structuredContent: { events },
    };
  },
});
