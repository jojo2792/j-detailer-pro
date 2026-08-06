import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "set_auto_renew",
  title: "Set auto-renew",
  description: "Turn auto-renew on or off for the signed-in member's active membership.",
  inputSchema: { auto_renew: z.boolean().describe("True to auto-renew each cycle, false to stop.") },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ auto_renew }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: current, error: readError } = await supabase
      .from("memberships")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (readError) return { content: [{ type: "text", text: readError.message }], isError: true };
    if (!current) {
      return {
        content: [{ type: "text", text: "No membership found for this account." }],
        isError: true,
      };
    }

    const { data, error } = await supabase
      .from("memberships")
      .update({ auto_renew, cancel_at_period_end: !auto_renew })
      .eq("id", current.id)
      .select("id,auto_renew,cancel_at_period_end,renewal_date")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [
        {
          type: "text",
          text: `Auto-renew is now ${auto_renew ? "on" : "off"}. ${JSON.stringify(data)}`,
        },
      ],
      structuredContent: { membership: data },
    };
  },
});
