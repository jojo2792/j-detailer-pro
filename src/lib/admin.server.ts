import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type {
  AdminAccess,
  AdminMemberFilters,
  AdminMemberRow,
  AdminMembersPage,
  AdminOverview,
  AppRole,
  PlanMixRow,
  RevenuePoint,
} from "@/types/admin";
import type { MembershipStatus } from "@/types/membership";

type Client = SupabaseClient<Database>;
type MembershipRow = Database["public"]["Tables"]["memberships"]["Row"];
type PlanRow = Database["public"]["Tables"]["membership_plans"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type HistoryRow = Database["public"]["Tables"]["membership_history"]["Row"];

const BILLING_EVENTS = new Set(["created", "activated", "renewed", "cycle_reset", "upgraded"]);

function fail(message: string): never {
  throw new Error(message);
}

/** Reads the caller's roles through their own RLS-scoped client and derives permissions. */
export async function loadAdminAccess(supabase: Client, userId: string): Promise<AdminAccess> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) fail(error.message);

  const roles = (data ?? []).map((r) => r.role as AppRole);
  const isAdmin = roles.includes("admin");
  const isTechnician = roles.includes("technician");

  return {
    roles,
    permissions: {
      canViewMembers: isAdmin || isTechnician,
      canViewRevenue: isAdmin,
      canExport: isAdmin,
      canManageMembers: isAdmin,
    },
  };
}

export async function requireAdminAccess(supabase: Client, userId: string): Promise<AdminAccess> {
  const access = await loadAdminAccess(supabase, userId);
  if (!access.permissions.canViewMembers) fail("You don't have access to the admin CRM.");
  return access;
}

async function fetchCrmData(supabase: Client) {
  const [memberships, plans, profiles] = await Promise.all([
    supabase.from("memberships").select("*"),
    supabase.from("membership_plans").select("*"),
    supabase.from("profiles").select("*"),
  ]);
  if (memberships.error) fail(memberships.error.message);
  if (plans.error) fail(plans.error.message);
  if (profiles.error) fail(profiles.error.message);

  return {
    memberships: (memberships.data ?? []) as MembershipRow[],
    plans: (plans.data ?? []) as PlanRow[],
    profiles: (profiles.data ?? []) as ProfileRow[],
  };
}

function monthKey(iso: string) {
  return iso.slice(0, 7);
}

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-TT", { month: "short", year: "2-digit" });
}

function lastMonths(count: number): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

export async function loadAdminOverview(supabase: Client, months = 12): Promise<AdminOverview> {
  const { memberships, plans } = await fetchCrmData(supabase);
  const planById = new Map(plans.map((p) => [p.id, p]));

  const { data: historyData, error: historyError } = await supabase
    .from("membership_history")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(5000);
  if (historyError) fail(historyError.message);
  const history = (historyData ?? []) as HistoryRow[];
  const planByMembership = new Map(memberships.map((m) => [m.id, m.plan_id]));

  const keys = lastMonths(months);
  const buckets = new Map<string, RevenuePoint>(
    keys.map((key) => [
      key,
      { month: key, label: monthLabel(key), revenueCents: 0, newMembers: 0, churned: 0 },
    ]),
  );

  for (const entry of history) {
    const bucket = buckets.get(monthKey(entry.created_at));
    if (!bucket) continue;

    if (BILLING_EVENTS.has(entry.event)) {
      const planId = entry.to_plan_id ?? planByMembership.get(entry.membership_id) ?? null;
      const plan = planId ? planById.get(planId) : undefined;
      if (plan && !plan.requires_quote) bucket.revenueCents += plan.monthly_price_cents;
    }
    if (entry.event === "created") bucket.newMembers += 1;
    if (entry.event === "cancelled" || entry.event === "expired") bucket.churned += 1;
  }

  const revenue = keys.map((key) => buckets.get(key)!);
  const currentMonth = keys[keys.length - 1]!;

  const active = memberships.filter((m) => m.status === "active");
  const paused = memberships.filter((m) => m.status === "paused");
  const cancelled = memberships.filter((m) => m.status === "cancelled" || m.status === "expired");

  const mrrCents = active.reduce((sum, m) => {
    const plan = planById.get(m.plan_id);
    return sum + (plan && !plan.requires_quote ? plan.monthly_price_cents : 0);
  }, 0);

  const newThisMonth = memberships.filter((m) => monthKey(m.created_at) === currentMonth).length;
  const churnedThisMonth = buckets.get(currentMonth)?.churned ?? 0;
  const churnBase = active.length + churnedThisMonth;
  const autoRenewOn = active.filter((m) => m.auto_renew).length;

  const mix = new Map<string, PlanMixRow>();
  for (const m of active) {
    const plan = planById.get(m.plan_id);
    if (!plan) continue;
    const row = mix.get(plan.slug) ?? {
      planSlug: plan.slug,
      planName: plan.name,
      members: 0,
      mrrCents: 0,
    };
    row.members += 1;
    row.mrrCents += plan.requires_quote ? 0 : plan.monthly_price_cents;
    mix.set(plan.slug, row);
  }

  return {
    kpis: {
      mrrCents,
      arpuCents: active.length ? Math.round(mrrCents / active.length) : 0,
      activeMembers: active.length,
      pausedMembers: paused.length,
      cancelledMembers: cancelled.length,
      totalMembers: memberships.length,
      newThisMonth,
      churnedThisMonth,
      churnRatePct: churnBase ? Math.round((churnedThisMonth / churnBase) * 1000) / 10 : 0,
      autoRenewPct: active.length ? Math.round((autoRenewOn / active.length) * 100) : 0,
    },
    revenue,
    planMix: [...mix.values()].sort((a, b) => b.mrrCents - a.mrrCents),
    generatedAt: new Date().toISOString(),
  };
}

function compare(a: AdminMemberRow, b: AdminMemberRow, key: AdminMemberFilters["sort"]): number {
  switch (key) {
    case "name":
      return a.fullName.localeCompare(b.fullName);
    case "plan":
      return a.planName.localeCompare(b.planName);
    case "status":
      return a.status.localeCompare(b.status);
    case "price":
      return a.priceCents - b.priceCents;
    case "started":
      return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
    case "renewal":
    default:
      return new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime();
  }
}

export async function loadAdminMemberRows(
  supabase: Client,
  filters: AdminMemberFilters,
): Promise<AdminMemberRow[]> {
  const { memberships, plans, profiles } = await fetchCrmData(supabase);
  const planById = new Map(plans.map((p) => [p.id, p]));
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  const search = filters.search.trim().toLowerCase();
  const fromTime = filters.from ? new Date(filters.from).getTime() : null;
  const toTime = filters.to ? new Date(filters.to).getTime() + 86_400_000 : null;

  const rows: AdminMemberRow[] = [];
  for (const m of memberships) {
    const plan = planById.get(m.plan_id);
    if (!plan) continue;
    const profile = profileById.get(m.user_id);
    const row: AdminMemberRow = {
      membershipId: m.id,
      userId: m.user_id,
      fullName: profile?.full_name?.trim() || profile?.email || "Unnamed customer",
      email: profile?.email ?? "",
      phone: profile?.phone ?? null,
      planSlug: plan.slug,
      planName: plan.name,
      priceCents: plan.monthly_price_cents,
      status: m.status as MembershipStatus,
      autoRenew: m.auto_renew,
      cancelAtPeriodEnd: m.cancel_at_period_end,
      startedAt: m.started_at,
      renewalDate: m.renewal_date,
      washesUsed: m.washes_used,
      washLimit: plan.monthly_wash_limit,
      interiorUsed: m.interior_details_used,
      interiorLimit: plan.monthly_interior_limit,
    };

    if (filters.statuses.length && !filters.statuses.includes(row.status)) continue;
    if (filters.planSlugs.length && !filters.planSlugs.includes(row.planSlug)) continue;
    if (filters.autoRenew === "on" && !row.autoRenew) continue;
    if (filters.autoRenew === "off" && row.autoRenew) continue;

    const started = new Date(row.startedAt).getTime();
    if (fromTime !== null && started < fromTime) continue;
    if (toTime !== null && started > toTime) continue;

    if (search) {
      const haystack = `${row.fullName} ${row.email} ${row.phone ?? ""} ${row.planName}`.toLowerCase();
      if (!haystack.includes(search)) continue;
    }

    rows.push(row);
  }

  const dir = filters.dir === "desc" ? -1 : 1;
  rows.sort((a, b) => compare(a, b, filters.sort) * dir);
  return rows;
}

export async function loadAdminMembers(
  supabase: Client,
  filters: AdminMemberFilters,
): Promise<AdminMembersPage> {
  const rows = await loadAdminMemberRows(supabase, filters);
  const pageSize = Math.min(Math.max(filters.pageSize, 5), 100);
  const pageCount = Math.max(Math.ceil(rows.length / pageSize), 1);
  const page = Math.min(Math.max(filters.page, 1), pageCount);
  const start = (page - 1) * pageSize;

  return {
    rows: rows.slice(start, start + pageSize),
    total: rows.length,
    page,
    pageSize,
    pageCount,
  };
}

const CSV_COLUMNS: { key: keyof AdminMemberRow; label: string }[] = [
  { key: "fullName", label: "Customer" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "planName", label: "Plan" },
  { key: "status", label: "Status" },
  { key: "priceCents", label: "Monthly value (cents)" },
  { key: "autoRenew", label: "Auto renew" },
  { key: "cancelAtPeriodEnd", label: "Cancels at period end" },
  { key: "startedAt", label: "Joined" },
  { key: "renewalDate", label: "Renews" },
  { key: "washesUsed", label: "Washes used" },
  { key: "washLimit", label: "Wash limit" },
  { key: "interiorUsed", label: "Interiors used" },
  { key: "interiorLimit", label: "Interior limit" },
];

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function buildMembersCsv(
  supabase: Client,
  filters: AdminMemberFilters,
): Promise<{ filename: string; csv: string; rowCount: number }> {
  const rows = await loadAdminMemberRows(supabase, filters);
  const lines = [CSV_COLUMNS.map((c) => csvCell(c.label)).join(",")];
  for (const row of rows) {
    lines.push(CSV_COLUMNS.map((c) => csvCell(row[c.key])).join(","));
  }
  const stamp = new Date().toISOString().slice(0, 10);
  return {
    filename: `j-the-detailer-members-${stamp}.csv`,
    csv: lines.join("\n"),
    rowCount: rows.length,
  };
}