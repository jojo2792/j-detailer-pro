import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type {
  BookingQuote,
  BookingRecord,
  NewBookingInput,
  ServiceOption,
  SlotOption,
  VehicleRecord,
} from "@/types/booking";

type Client = SupabaseClient<Database>;

/** Mobile detailing hours, Trinidad time (UTC-4). Sundays closed. */
const OPEN_HOUR = 8;
const CLOSE_HOUR = 16;
const TT_OFFSET = "-04:00";

function fail(message: string): never {
  throw new Error(message);
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function mapService(row: Database["public"]["Tables"]["services"]["Row"]): ServiceOption {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    durationMinutes: row.duration_minutes,
    basePriceCents: row.base_price_cents,
    includes: toStringArray(row.includes),
    membershipCovered: row.membership_covered,
  };
}

function mapVehicle(row: Database["public"]["Tables"]["vehicles"]["Row"]): VehicleRecord {
  return {
    id: row.id,
    vehicleType: row.vehicle_type,
    make: row.make,
    model: row.model,
    year: row.year,
    color: row.color,
    plate: row.plate,
    isDefault: row.is_default,
  };
}

export async function loadServices(supabase: Client): Promise<ServiceOption[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) fail(error.message);
  return (data ?? []).map(mapService);
}

export async function loadVehicles(supabase: Client, userId: string): Promise<VehicleRecord[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) fail(error.message);
  return (data ?? []).map(mapVehicle);
}

/** Availability is global, so booked starts are read with elevated rights (start times only). */
export async function loadSlots(date: string): Promise<SlotOption[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail("Pick a valid date.");
  const dayStart = new Date(`${date}T00:00:00${TT_OFFSET}`);
  if (Number.isNaN(dayStart.getTime())) fail("Pick a valid date.");
  if (dayStart.getUTCDay() === 0) return [];

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("scheduled_at")
    .neq("status", "cancelled")
    .gte("scheduled_at", new Date(`${date}T00:00:00${TT_OFFSET}`).toISOString())
    .lt("scheduled_at", new Date(dayStart.getTime() + 86_400_000).toISOString());
  if (error) fail(error.message);
  const taken = new Set((data ?? []).map((row) => new Date(row.scheduled_at).toISOString()));

  const slots: SlotOption[] = [];
  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour += 1) {
    const iso = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00${TT_OFFSET}`).toISOString();
    const suffix = hour >= 12 ? "PM" : "AM";
    const display = hour % 12 === 0 ? 12 : hour % 12;
    slots.push({
      startsAt: iso,
      label: `${display}:00 ${suffix}`,
      available: !taken.has(iso) && new Date(iso).getTime() > Date.now(),
    });
  }
  return slots;
}

async function loadMembershipBenefit(supabase: Client, userId: string) {
  const { data, error } = await supabase
    .from("memberships")
    .select("id, plan_id, status, membership_plans!memberships_plan_id_fkey(name, discount_percentage, reward_multiplier)")
    .eq("user_id", userId)
    .in("status", ["active", "pending"])
    .maybeSingle();
  if (error) fail(error.message);
  const plan = data?.membership_plans as
    | { name: string; discount_percentage: number; reward_multiplier: number }
    | null
    | undefined;
  if (!data || !plan) return null;
  return {
    membershipId: data.id,
    planName: plan.name,
    discountPercentage: Number(plan.discount_percentage ?? 0),
    rewardMultiplier: Number(plan.reward_multiplier ?? 1),
  };
}

export async function quoteBooking(
  supabase: Client,
  userId: string,
  serviceSlug: string,
): Promise<BookingQuote> {
  const services = await loadServices(supabase);
  const service = services.find((s) => s.slug === serviceSlug) ?? fail("That service is unavailable.");
  const benefit = await loadMembershipBenefit(supabase, userId);
  const discount = benefit?.discountPercentage ?? 0;
  return {
    basePriceCents: service.basePriceCents,
    discountPercentage: discount,
    totalPriceCents: Math.round(service.basePriceCents * (1 - discount / 100)),
    planName: benefit?.planName ?? null,
    rewardMultiplier: benefit?.rewardMultiplier ?? 1,
  };
}

function mapBooking(
  row: Database["public"]["Tables"]["bookings"]["Row"] & { services?: { name: string } | null },
): BookingRecord {
  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    serviceName: row.services?.name ?? "Detailing service",
    vehicleSummary: row.vehicle_summary,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    addressLine: row.address_line,
    city: row.city,
    notes: row.notes,
    basePriceCents: row.base_price_cents,
    discountPercentage: Number(row.discount_percentage ?? 0),
    totalPriceCents: row.total_price_cents,
  };
}

export async function loadMyBookings(supabase: Client, userId: string): Promise<BookingRecord[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, services(name)")
    .eq("user_id", userId)
    .order("scheduled_at", { ascending: false })
    .limit(40);
  if (error) fail(error.message);
  return (data ?? []).map((row) => mapBooking(row as never));
}

function assertSlot(startsAt: string) {
  const when = new Date(startsAt);
  if (Number.isNaN(when.getTime())) fail("Pick a valid time slot.");
  if (when.getTime() <= Date.now()) fail("Choose a time in the future.");
  if (when.getUTCMinutes() !== 0) fail("Bookings start on the hour.");
  return when;
}

export async function createBooking(
  supabase: Client,
  userId: string,
  input: NewBookingInput,
): Promise<BookingRecord> {
  const when = assertSlot(input.startsAt);

  const services = await loadServices(supabase);
  const service = services.find((s) => s.slug === input.serviceSlug) ?? fail("That service is unavailable.");

  const slots = await loadSlots(when.toISOString().slice(0, 10));
  const slot = slots.find((s) => s.startsAt === when.toISOString());
  if (!slot) fail("That time is outside our opening hours.");
  if (!slot.available) fail("Sorry — that slot was just taken. Please pick another.");

  let vehicleId = input.vehicleId ?? null;
  let vehicleSummary: string | null = null;

  if (vehicleId) {
    const owned = (await loadVehicles(supabase, userId)).find((v) => v.id === vehicleId);
    if (!owned) fail("That vehicle could not be found on your account.");
    vehicleSummary = [owned.year, owned.make, owned.model].filter(Boolean).join(" ");
  } else if (input.vehicle) {
    const { data, error } = await supabase
      .from("vehicles")
      .insert({
        user_id: userId,
        vehicle_type: input.vehicle.vehicleType,
        make: input.vehicle.make,
        model: input.vehicle.model,
        year: input.vehicle.year ?? null,
        color: input.vehicle.color ?? null,
        plate: input.vehicle.plate ?? null,
      })
      .select("*")
      .single();
    if (error) fail(error.message);
    vehicleId = data.id;
    vehicleSummary = [data.year, data.make, data.model].filter(Boolean).join(" ");
  } else {
    fail("Add your vehicle details to continue.");
  }

  const benefit = await loadMembershipBenefit(supabase, userId);
  const discount = benefit?.discountPercentage ?? 0;

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      user_id: userId,
      service_id: service.id,
      vehicle_id: vehicleId,
      membership_id: benefit?.membershipId ?? null,
      status: "pending",
      scheduled_at: when.toISOString(),
      duration_minutes: service.durationMinutes,
      contact_name: input.contactName,
      contact_phone: input.contactPhone,
      address_line: input.addressLine,
      city: input.city,
      notes: input.notes ?? null,
      vehicle_summary: vehicleSummary,
      base_price_cents: service.basePriceCents,
      discount_percentage: discount,
      total_price_cents: Math.round(service.basePriceCents * (1 - discount / 100)),
    })
    .select("*, services(name)")
    .single();
  if (error) {
    if (error.code === "23505" || error.message.includes("bookings_unique_live_slot")) {
      fail("Sorry — that slot was just taken. Please pick another.");
    }
    fail(error.message);
  }
  return mapBooking(data as never);
}

export async function cancelBooking(
  supabase: Client,
  userId: string,
  bookingId: string,
): Promise<BookingRecord[]> {
  const { data: row, error: readError } = await supabase
    .from("bookings")
    .select("status")
    .eq("id", bookingId)
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) fail(readError.message);
  if (!row) fail("Booking not found.");
  if (row.status === "cancelled") fail("That booking is already cancelled.");
  if (row.status === "completed" || row.status === "in_progress") {
    fail("This appointment is already underway — call us to make changes.");
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("user_id", userId);
  if (error) fail(error.message);
  return loadMyBookings(supabase, userId);
}

export async function rescheduleBooking(
  supabase: Client,
  userId: string,
  bookingId: string,
  startsAt: string,
): Promise<BookingRecord[]> {
  const when = assertSlot(startsAt);
  const slots = await loadSlots(when.toISOString().slice(0, 10));
  const slot = slots.find((s) => s.startsAt === when.toISOString());
  if (!slot) fail("That time is outside our opening hours.");
  if (!slot.available) fail("Sorry — that slot was just taken. Please pick another.");

  const { data: row, error: readError } = await supabase
    .from("bookings")
    .select("status")
    .eq("id", bookingId)
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) fail(readError.message);
  if (!row) fail("Booking not found.");
  if (row.status !== "pending" && row.status !== "confirmed") {
    fail("Only upcoming appointments can be rescheduled.");
  }

  const { error } = await supabase
    .from("bookings")
    .update({ scheduled_at: when.toISOString() })
    .eq("id", bookingId)
    .eq("user_id", userId);
  if (error) fail(error.message);
  return loadMyBookings(supabase, userId);
}
