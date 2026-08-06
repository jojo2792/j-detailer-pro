import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { AppRole, StaffDirectory, StaffMemberRow } from "@/types/admin";

type Client = SupabaseClient<Database>;

const ROLES: AppRole[] = ["customer", "technician", "admin"];

function fail(message: string): never {
  throw new Error(message);
}

/** Confirms the caller holds the admin role through their own RLS-scoped client. */
export async function requireRoleManager(supabase: Client, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin");
  if (error) fail(error.message);
  if (!data?.length) fail("Only admins can manage role permissions.");
}

/** Full account directory with roles. Uses the privileged client after the admin check. */
export async function loadStaffDirectory(
  admin: Client,
  currentUserId: string,
  search: string,
): Promise<StaffDirectory> {
  const [profiles, roles] = await Promise.all([
    admin.from("profiles").select("id, full_name, email, phone, created_at"),
    admin.from("user_roles").select("user_id, role"),
  ]);
  if (profiles.error) fail(profiles.error.message);
  if (roles.error) fail(roles.error.message);

  const rolesByUser = new Map<string, AppRole[]>();
  for (const entry of roles.data ?? []) {
    const list = rolesByUser.get(entry.user_id) ?? [];
    list.push(entry.role as AppRole);
    rolesByUser.set(entry.user_id, list);
  }

  const counts = { customer: 0, technician: 0, admin: 0 } as Record<AppRole, number>;
  for (const list of rolesByUser.values()) {
    for (const role of list) counts[role] += 1;
  }

  const needle = search.trim().toLowerCase();
  const rows: StaffMemberRow[] = (profiles.data ?? [])
    .map((p) => {
      const userRoles = (rolesByUser.get(p.id) ?? []).slice().sort(
        (a, b) => ROLES.indexOf(b) - ROLES.indexOf(a),
      );
      return {
        userId: p.id,
        fullName: p.full_name?.trim() || p.email || "Unnamed account",
        email: p.email ?? "",
        phone: p.phone ?? null,
        roles: userRoles,
        joinedAt: p.created_at,
        isSelf: p.id === currentUserId,
      };
    })
    .filter((row) =>
      needle ? `${row.fullName} ${row.email} ${row.phone ?? ""}`.toLowerCase().includes(needle) : true,
    )
    .sort((a, b) => {
      const rank = (r: StaffMemberRow) => (r.roles.includes("admin") ? 0 : r.roles.includes("technician") ? 1 : 2);
      return rank(a) - rank(b) || a.fullName.localeCompare(b.fullName);
    });

  return { rows, counts };
}

export async function grantRole(admin: Client, userId: string, role: AppRole): Promise<void> {
  const { error } = await admin.from("user_roles").insert({ user_id: userId, role });
  if (error && !/duplicate key/i.test(error.message)) fail(error.message);
}

export async function revokeRole(
  admin: Client,
  currentUserId: string,
  userId: string,
  role: AppRole,
): Promise<void> {
  if (role === "admin" && userId === currentUserId) {
    fail("You can't remove your own admin access.");
  }
  if (role === "admin") {
    const { data, error } = await admin.from("user_roles").select("user_id").eq("role", "admin");
    if (error) fail(error.message);
    if ((data ?? []).length <= 1) fail("At least one admin must remain.");
  }
  const { error } = await admin.from("user_roles").delete().eq("user_id", userId).eq("role", role);
  if (error) fail(error.message);
}
