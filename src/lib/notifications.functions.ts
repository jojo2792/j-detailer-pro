import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface NotificationItem {
  id: string;
  kind: string;
  title: string;
  body: string;
  deliveryStatus: string;
  readAt: string | null;
  createdAt: string;
}

export interface UpcomingReminder {
  bookingId: string;
  reference: string;
  serviceName: string;
  scheduledAt: string;
}

export interface MyNotifications {
  items: NotificationItem[];
  unread: number;
  reminders: UpcomingReminder[];
}

const REMINDER_WINDOW_MS = 48 * 60 * 60 * 1000;

/** Own notifications (RLS) plus reminders derived from upcoming bookings in the next 48 hours. */
export const getMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyNotifications> => {
    const { supabase, userId } = context;
    const now = new Date();
    const [list, upcoming] = await Promise.all([
      supabase
        .from("notifications")
        .select("id, kind, title, body, delivery_status, read_at, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("bookings")
        .select("id, reference, scheduled_at, status, services(name)")
        .eq("user_id", userId)
        .in("status", ["pending", "confirmed"])
        .gte("scheduled_at", now.toISOString())
        .lte("scheduled_at", new Date(now.getTime() + REMINDER_WINDOW_MS).toISOString())
        .order("scheduled_at", { ascending: true }),
    ]);
    if (list.error) throw new Error(list.error.message);
    if (upcoming.error) throw new Error(upcoming.error.message);

    const items = (list.data ?? []).map((n) => ({
      id: n.id,
      kind: n.kind,
      title: n.title,
      body: n.body,
      deliveryStatus: n.delivery_status,
      readAt: n.read_at,
      createdAt: n.created_at,
    }));
    return {
      items,
      unread: items.filter((i) => !i.readAt).length,
      reminders: (upcoming.data ?? []).map((b) => ({
        bookingId: b.id,
        reference: b.reference,
        serviceName: (b.services as { name: string } | null)?.name ?? "Detailing service",
        scheduledAt: b.scheduled_at,
      })),
    };
  });

export const markMyNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ ids: z.array(z.string().uuid()).optional() }).parse(data))
  .handler(async ({ data, context }): Promise<number> => {
    const { data: n, error } = await context.supabase.rpc("mark_my_notifications_read", {
      _ids: data.ids ?? undefined,
    });
    if (error) throw new Error(error.message);
    return Number(n ?? 0);
  });

/** Admin-only feed across all customers; RLS ("Admins can read all notifications") enforces it. */
export const getRecentNotificationsForAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NotificationItem[]> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Only admins can view all notifications.");
    const { data, error } = await context.supabase
      .from("notifications")
      .select("id, kind, title, body, delivery_status, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return (data ?? []).map((n) => ({
      id: n.id,
      kind: n.kind,
      title: n.title,
      body: n.body,
      deliveryStatus: n.delivery_status,
      readAt: n.read_at,
      createdAt: n.created_at,
    }));
  });
