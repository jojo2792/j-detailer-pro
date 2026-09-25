import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, CalendarClock, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { formatDateTime } from "@/lib/format";
import {
  getMyNotifications,
  getRecentNotificationsForAdmin,
  markMyNotificationsRead,
} from "@/lib/notifications.functions";

const KEY = ["notifications", "mine"] as const;

export function NotificationsPanel() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fetchMine = useServerFn(getMyNotifications);
  const markRead = useServerFn(markMyNotificationsRead);
  const q = useQuery({ queryKey: KEY, queryFn: () => fetchMine(), enabled: Boolean(user) });
  const mark = useMutation({
    mutationFn: () => markRead({ data: {} }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });

  return (
    <section className="rounded-2xl border border-border bg-card p-6" aria-labelledby="notif-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" aria-hidden />
          <h2 id="notif-heading" className="text-xs font-semibold uppercase tracking-widest text-primary">
            Notifications{q.data?.unread ? ` · ${q.data.unread} new` : ""}
          </h2>
        </div>
        {q.data?.unread ? (
          <button
            type="button"
            disabled={mark.isPending}
            onClick={() => mark.mutate()}
            className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary disabled:opacity-50"
          >
            Mark all read
          </button>
        ) : null}
      </div>

      {q.isLoading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading notifications…
        </div>
      ) : q.isError || !q.data ? (
        <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
          Notifications didn&apos;t load.
          <button type="button" onClick={() => void q.refetch()} className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      ) : (
        <>
          {q.data.reminders.map((r) => (
            <div key={r.bookingId} className="mt-4 flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4 text-sm">
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <div>
                <div className="font-semibold">Upcoming: {r.serviceName}</div>
                <div className="text-muted-foreground">{formatDateTime(r.scheduledAt)} · Ref {r.reference}</div>
              </div>
            </div>
          ))}
          {q.data.items.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No notifications yet. Booking confirmations and status updates will appear here.
            </p>
          ) : (
            <NotificationList items={q.data.items} />
          )}
        </>
      )}
    </section>
  );
}

function NotificationList({ items }: { items: { id: string; title: string; body: string; readAt: string | null; createdAt: string }[] }) {
  return (
    <ul className="mt-4 divide-y divide-border">
      {items.map((n) => (
        <li key={n.id} className="py-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <span className={n.readAt ? "text-muted-foreground" : "font-semibold"}>{n.title}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</span>
          </div>
          <p className="mt-1 text-muted-foreground">{n.body}</p>
        </li>
      ))}
    </ul>
  );
}

/** Admin-only feed of recent customer notifications. */
export function AdminNotificationsFeed() {
  const fetchAll = useServerFn(getRecentNotificationsForAdmin);
  const q = useQuery({ queryKey: ["notifications", "admin"], queryFn: () => fetchAll() });
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">Recent customer notifications</h2>
      {q.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : q.isError ? (
        <p className="mt-4 text-sm text-muted-foreground">Notifications didn&apos;t load.</p>
      ) : !q.data?.length ? (
        <p className="mt-4 text-sm text-muted-foreground">No notifications sent yet.</p>
      ) : (
        <NotificationList items={q.data} />
      )}
    </section>
  );
}
