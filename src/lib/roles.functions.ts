import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { StaffDirectory } from "@/types/admin";

const roleSchema = z.enum(["customer", "technician", "admin"]);

const mutationSchema = z.object({
  userId: z.string().uuid(),
  role: roleSchema,
  grant: z.boolean(),
});

const searchSchema = z.object({ search: z.string().max(120).default("") });

export const getStaffDirectory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => searchSchema.parse(data ?? {}))
  .handler(async ({ data, context }): Promise<StaffDirectory> => {
    const { requireRoleManager, loadStaffDirectory } = await import("@/lib/roles.server");
    await requireRoleManager(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return loadStaffDirectory(supabaseAdmin, context.userId, data.search);
  });

export const setStaffRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => mutationSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { requireRoleManager, grantRole, revokeRole } = await import("@/lib/roles.server");
    await requireRoleManager(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) await grantRole(supabaseAdmin, data.userId, data.role);
    else await revokeRole(supabaseAdmin, context.userId, data.userId, data.role);
    return { ok: true };
  });
