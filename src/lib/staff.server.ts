import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { BookingStatus } from "@/types/booking";
import type { StaffAccess, StaffBoard, StaffJob, StaffScope } from "@/types/staff";

type Client = SupabaseClient<Database>;

const TT_OFFSET = "-04:00";

/** Staff may only move a job along these transitions; everything else is rejected server-side. */
const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "in_progress", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

function fail(message: string): never {
  throw new Error(message);
}

/** Roles are read through the caller's own RLS-scoped client. */
export async function loadStaffAccess(supabase: Client, userId: string): Promise<StaffAccess> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) fail(error.message);
  const roles = (data ?? []).map((r) => r.role as string);
  const isAdmin = roles.includes("admin");
  const isTechnician = roles.includes("technician");
  return { isStaff: isAdmin || isTechnician, isAdmin, isTechnician };
}

export async function requireStaffAccess(supabase: Client, userId: string): Promise<StaffAccess> {
  const access = await loadStaffAccess(supabase, userId);
  if (!access.isStaff) fail("This area is limited to J The Detailer staff accounts.");
  return access;
}

type JobRow = Database["public"]["Tables"]["bookings"]["Row"] & {
  services?: { name: string; category: string } | null;
  vehicles?: {
    make: string;
    model: string;
    year: number | null;
    color: string | null;
    plate: string | null;
  } | null;
};

function mapJob(row: JobRow, userId: string): StaffJob {
  const v = row.vehicles;
  const detail = v
    ? [ [v.year, v.make, v.model].filter(Boolean).join(" "), v.color, v.plate ]
        .filter((part) => Boolean(part && String(part).trim()))
        .join(" · ")
    : null;

  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    serviceName: row.services?.name ?? "Detailing service",
    serviceCategory: row.services?.category ?? "detailing",
    vehicleSummary: row.vehicle_summary,
    vehicleDetail: detail && detail.length > 0 ? detail : null,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    addressLine: row.address_line,
    city: row.city,
    notes: row.notes,
    technicianId: row.technician_id,
    assignedToMe: row.technician_id === userId,
  };
}

const SELECT = "*, services(name, category), vehicles(make, model, year, color, plate)";

function todayRangeTT() {
  const now = new Date();
  const local = new Date(now.getTime() - 4 * 3_600_000);
  const date = local.toISOString().slice(0, 10);
  const start = new Date(`${date}T00:00:00${TT_OFFSET}`);
  return { startIso: start.toISOString(), endIso: new Date(start.getTime() + 86_400_000).toISOString() };
}

/** Staff board. RLS ("Staff can read all bookings") is the security boundary; access is re-checked here. */
export async function loadStaffBoard(
  supabase: Client,
  userId: string,
  scope: StaffScope,
): Promise<StaffBoard> {
  await requireStaffAccess(supabase, userId);

  const { startIso, endIso } = todayRangeTT();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("bookings")
    .select(SELECT)
    .neq("status", "cancelled")
    .gte("scheduled_at", startIso)
    .order("scheduled_at", { ascending: true })
    .limit(200);
  if (error) fail(error.message);

  const all = (data ?? []).map((row) => mapJob(row as JobRow, userId));
  const isToday = (job: StaffJob) => job.scheduledAt >= startIso && job.scheduledAt < endIso;
  const isUpcoming = (job: StaffJob) => job.scheduledAt >= nowIso;

  const counts = {
    today: all.filter(isToday).length,
    upcoming: all.filter(isUpcoming).length,
    mine: all.filter((job) => job.assignedToMe).length,
  };

  const jobs =
    scope === "today"
      ? all.filter(isToday)
      : scope === "mine"
        ? all.filter((job) => job.assignedToMe)
        : all.filter(isUpcoming);

  return { scope, jobs, counts, generatedAt: new Date().toISOString() };
}

/**
 * Status changes are validated against the allowed transition map. Completion simply writes
 * status = 'completed', so the existing award_booking_rewards trigger fires exactly once
 * (its unique earn-per-booking index guarantees idempotency). No reward logic lives here.
 */
export async function updateJobStatus(
  supabase: Client,
  userId: string,
  bookingId: string,
  status: BookingStatus,
  scope: StaffScope,
): Promise<StaffBoard> {
  await requireStaffAccess(supabase, userId);

  const { data: row, error: readError } = await supabase
    .from("bookings")
    .select("status")
    .eq("id", bookingId)
    .maybeSingle();
  if (readError) fail(readError.message);
  if (!row) fail("Appointment not found.");

  const current = row.status as BookingStatus;
  if (current === status) fail("That appointment is already in this state.");
  if (!ALLOWED_TRANSITIONS[current].includes(status)) {
    fail(`An appointment that is ${current.replace("_", " ")} can't be moved to ${status.replace("_", " ")}.`);
  }

  const patch: Database["public"]["Tables"]["bookings"]["Update"] = { status };
  if (status === "cancelled") patch.cancelled_at = new Date().toISOString();

  const { error } = await supabase.from("bookings").update(patch).eq("id", bookingId);
  if (error) fail(error.message);

  return loadStaffBoard(supabase, userId, scope);
}

/** Claim assigns the job to the acting staff member; release only clears their own assignment. */
export async function setJobAssignment(
  supabase: Client,
  userId: string,
  bookingId: string,
  claim: boolean,
  scope: StaffScope,
): Promise<StaffBoard> {
  await requireStaffAccess(supabase, userId);

  const { data: row, error: readError } = await supabase
    .from("bookings")
    .select("status, technician_id")
    .eq("id", bookingId)
    .maybeSingle();
  if (readError) fail(readError.message);
  if (!row) fail("Appointment not found.");
  if (row.status === "completed" || row.status === "cancelled") {
    fail("This appointment is closed and can't be reassigned.");
  }

  if (claim) {
    if (row.technician_id && row.technician_id !== userId) {
      fail("Another technician is already assigned to this appointment.");
    }
  } else if (row.technician_id !== userId) {
    fail("You can only release appointments assigned to you.");
  }

  const { error } = await supabase
    .from("bookings")
    .update({ technician_id: claim ? userId : null })
    .eq("id", bookingId);
  if (error) fail(error.message);

  return loadStaffBoard(supabase, userId, scope);
}
