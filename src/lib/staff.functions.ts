import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { StaffAccess, StaffBoard } from "@/types/staff";

const scopeSchema = z.enum(["today", "upcoming", "mine"]);
const statusSchema = z.enum(["pending", "confirmed", "in_progress", "completed", "cancelled"]);

export const getStaffAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StaffAccess> => {
    const { loadStaffAccess } = await import("@/lib/staff.server");
    return loadStaffAccess(context.supabase, context.userId);
  });

export const getStaffBoard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ scope: scopeSchema }).parse(data))
  .handler(async ({ data, context }): Promise<StaffBoard> => {
    const { loadStaffBoard } = await import("@/lib/staff.server");
    return loadStaffBoard(context.supabase, context.userId, data.scope);
  });

export const setStaffJobStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ bookingId: z.string().uuid(), status: statusSchema, scope: scopeSchema })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<StaffBoard> => {
    const { updateJobStatus } = await import("@/lib/staff.server");
    return updateJobStatus(context.supabase, context.userId, data.bookingId, data.status, data.scope);
  });

export const setStaffJobAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ bookingId: z.string().uuid(), claim: z.boolean(), scope: scopeSchema }).parse(data),
  )
  .handler(async ({ data, context }): Promise<StaffBoard> => {
    const { setJobAssignment } = await import("@/lib/staff.server");
    return setJobAssignment(context.supabase, context.userId, data.bookingId, data.claim, data.scope);
  });
