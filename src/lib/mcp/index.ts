import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMembershipPlans from "./tools/list-membership-plans";
import getMyMembership from "./tools/get-my-membership";
import listMembershipHistory from "./tools/list-membership-history";
import setAutoRenew from "./tools/set-auto-renew";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "j-detailer-pro",
  title: "J Detailer Pro",
  version: "0.1.0",
  instructions:
    "Tools for J The Detailer memberships. Use `list_membership_plans` for plan pricing and limits, `get_my_membership` for the signed-in member's plan, cycle usage and renewal date, `list_membership_history` for their membership event log, and `set_auto_renew` to turn auto-renew on or off.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listMembershipPlans, getMyMembership, listMembershipHistory, setAutoRenew],
});
