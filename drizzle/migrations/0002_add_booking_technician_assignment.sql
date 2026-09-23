-- Additive: optional technician assignment on bookings for the staff portal.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS technician_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS bookings_technician_id_idx
  ON public.bookings (technician_id, scheduled_at);

CREATE INDEX IF NOT EXISTS bookings_scheduled_at_idx
  ON public.bookings (scheduled_at);

COMMENT ON COLUMN public.bookings.technician_id IS
  'Optional assigned staff member (auth.users.id). Assigned/claimed through server-validated staff operations; existing staff RLS policies govern access.';