import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type {
  BookingQuote,
  BookingRecord,
  ServiceOption,
  SlotOption,
  VehicleRecord,
} from "@/types/booking";

const dateInput = (data: unknown) =>
  z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date.") }).parse(data);

const slugInput = (data: unknown) => z.object({ serviceSlug: z.string().min(1).max(60) }).parse(data);

const newBookingSchema = z.object({
  serviceSlug: z.string().min(1).max(60),
  startsAt: z.string().min(10),
  vehicleId: z.string().uuid().optional(),
  vehicle: z
    .object({
      vehicleType: z.string().min(1).max(30),
      make: z.string().min(1).max(40),
      model: z.string().min(1).max(40),
      year: z.number().int().min(1950).max(2100).optional(),
      color: z.string().max(30).optional(),
      plate: z.string().max(20).optional(),
    })
    .optional(),
  contactName: z.string().min(2, "Enter your name.").max(80),
  contactPhone: z.string().min(7, "Enter a contact number.").max(30),
  addressLine: z.string().min(5, "Enter the service address.").max(160),
  city: z.string().min(2, "Enter the city or area.").max(60),
  notes: z.string().max(500).optional(),
});

export const listServices = createServerFn({ method: "GET" }).handler(
  async (): Promise<ServiceOption[]> => {
    const { createPublicSupabaseClient } = await import("@/lib/supabase-public.server");
    const { loadServices } = await import("@/lib/booking.server");
    return loadServices(createPublicSupabaseClient());
  },
);

export const listSlots = createServerFn({ method: "GET" })
  .inputValidator(dateInput)
  .handler(async ({ data }): Promise<SlotOption[]> => {
    const { loadSlots } = await import("@/lib/booking.server");
    return loadSlots(data.date);
  });

export const listMyVehicles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VehicleRecord[]> => {
    const { loadVehicles } = await import("@/lib/booking.server");
    return loadVehicles(context.supabase, context.userId);
  });

export const quoteService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(slugInput)
  .handler(async ({ data, context }): Promise<BookingQuote> => {
    const { quoteBooking } = await import("@/lib/booking.server");
    return quoteBooking(context.supabase, context.userId, data.serviceSlug);
  });

export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BookingRecord[]> => {
    const { loadMyBookings } = await import("@/lib/booking.server");
    return loadMyBookings(context.supabase, context.userId);
  });

export const createMyBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => newBookingSchema.parse(data))
  .handler(async ({ data, context }): Promise<BookingRecord> => {
    const { createBooking } = await import("@/lib/booking.server");
    return createBooking(context.supabase, context.userId, data);
  });

export const cancelMyBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ bookingId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<BookingRecord[]> => {
    const { cancelBooking } = await import("@/lib/booking.server");
    return cancelBooking(context.supabase, context.userId, data.bookingId);
  });

export const rescheduleMyBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ bookingId: z.string().uuid(), startsAt: z.string().min(10) }).parse(data),
  )
  .handler(async ({ data, context }): Promise<BookingRecord[]> => {
    const { rescheduleBooking } = await import("@/lib/booking.server");
    return rescheduleBooking(context.supabase, context.userId, data.bookingId, data.startsAt);
  });
