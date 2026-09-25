import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMyBookings, useSlots } from "@/hooks/use-booking";
import { useAuth } from "@/hooks/use-auth";
import { formatDateTime, formatTTD } from "@/lib/format";
import type { BookingRecord } from "@/types/booking";

const STATUS_LABEL: Record<BookingRecord["status"], string> = {
  pending: "Awaiting confirmation",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function RescheduleRow({
  booking,
  onMove,
  isPending,
}: {
  booking: BookingRecord;
  onMove: (startsAt: string) => void;
  isPending: boolean;
}) {
  const [date, setDate] = useState(booking.scheduledAt.slice(0, 10));
  const slots = useSlots(date);

  return (
    <div className="mt-4 rounded-xl border border-border p-4">
      <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground" htmlFor={`d-${booking.id}`}>
        New date
      </label>
      <input
        id={`d-${booking.id}`}
        type="date"
        className="mt-2 w-full max-w-xs rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {slots.isLoading ? (
          <span className="text-sm text-muted-foreground">Checking availability…</span>
        ) : slots.data?.length ? (
          slots.data.map((slot) => (
            <button
              key={slot.startsAt}
              type="button"
              disabled={!slot.available || isPending}
              onClick={() => onMove(slot.startsAt)}
              className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-widest hover:border-primary hover:text-primary disabled:opacity-35"
            >
              {slot.label}
            </button>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">No times available on that date.</span>
        )}
      </div>
    </div>
  );
}

export function MyAppointments() {
  const { bookings, isLoading, isError, cancel, reschedule } = useMyBookings(Boolean(useAuth().user));
  const [movingId, setMovingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Loading your appointments…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-destructive">
        Your appointments didn't load. Please refresh the page.
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">No appointments yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Book your next detail and we'll bring the shop to you.
        </p>
        <Link
          to="/book"
          className="mt-5 inline-flex items-center justify-center rounded-full bg-gradient-gold px-7 py-3 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-gold"
        >
          Book a detail
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">My appointments</h2>
        <Link to="/book" className="text-xs font-semibold uppercase tracking-widest text-primary">
          Book another
        </Link>
      </div>
      <ul className="mt-5 space-y-4">
        {bookings.map((b) => {
          const changeable = b.status === "pending" || b.status === "confirmed";
          return (
            <li key={b.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-display text-base font-semibold">{b.serviceName}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(b.scheduledAt)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {b.vehicleSummary ? `${b.vehicleSummary} · ` : ""}
                    {b.addressLine}, {b.city}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                    {STATUS_LABEL[b.status]}
                  </div>
                  <div className="mt-1 text-sm">{formatTTD(b.totalPriceCents)}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Ref {b.reference}
                  </div>
                </div>
              </div>

              {changeable ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setMovingId(movingId === b.id ? null : b.id)}
                    className="rounded-full border border-border px-5 py-2 text-xs font-semibold uppercase tracking-widest hover:border-primary hover:text-primary"
                  >
                    {movingId === b.id ? "Close" : "Reschedule"}
                  </button>
                  <button
                    type="button"
                    disabled={cancel.isPending}
                    onClick={() => cancel.mutate(b.id)}
                    className="rounded-full border border-border px-5 py-2 text-xs font-semibold uppercase tracking-widest text-destructive hover:border-destructive disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}

              {movingId === b.id ? (
                <RescheduleRow
                  booking={b}
                  isPending={reschedule.isPending}
                  onMove={(startsAt) => {
                    reschedule.mutate(
                      { bookingId: b.id, startsAt },
                      { onSuccess: () => setMovingId(null) },
                    );
                  }}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
