import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AdminAccess, AdminMembersPage, AdminOverview } from "@/types/admin";

const filtersSchema = z.object({
  search: z.string().max(120).default(""),
  statuses: z.array(z.enum(["pending", "active", "paused", "cancelled", "expired"])).default([]),
  planSlugs: z.array(z.string().max(50)).default([]),
  from: z.string().nullable().default(null),
  to: z.string().nullable().default(null),
  autoRenew: z.enum(["any", "on", "off"]).default("any"),
  sort: z.enum(["name", "plan", "status", "renewal", "started", "price"]).default("renewal"),
  dir: z.enum(["asc", "desc"]).default("asc"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(5).max(100).default(25),
});

const parseFilters = (data: unknown) => filtersSchema.parse(data ?? {});

export const getAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminAccess> => {
    const { loadAdminAccess } = await import("@/lib/admin.server");
    return loadAdminAccess(context.supabase, context.userId);
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOverview> => {
    const { loadAdminOverview, loadAdminAccess } = await import("@/lib/admin.server");
    const access = await loadAdminAccess(context.supabase, context.userId);
    if (!access.permissions.canViewRevenue) throw new Error("Revenue analytics are admin-only.");
    return loadAdminOverview(context.supabase);
  });

export const getAdminMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(parseFilters)
  .handler(async ({ data, context }): Promise<AdminMembersPage> => {
    const { loadAdminMembers, requireAdminAccess } = await import("@/lib/admin.server");
    await requireAdminAccess(context.supabase, context.userId);
    return loadAdminMembers(context.supabase, data);
  });

export const exportAdminMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(parseFilters)
  .handler(async ({ data, context }): Promise<{ filename: string; csv: string; rowCount: number }> => {
    const { buildMembersCsv, loadAdminAccess } = await import("@/lib/admin.server");
    const access = await loadAdminAccess(context.supabase, context.userId);
    if (!access.permissions.canExport) throw new Error("Exports are admin-only.");
    return buildMembersCsv(context.supabase, data);
  });