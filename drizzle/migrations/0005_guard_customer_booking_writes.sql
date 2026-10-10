CREATE OR REPLACE FUNCTION public.guard_booking_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  price integer;
  disc numeric := 0;
BEGIN
  -- Backend/service calls and staff are trusted; RLS already scopes them.
  IF uid IS NULL OR public.has_role(uid, 'admin') OR public.has_role(uid, 'technician') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT base_price_cents INTO price FROM public.services WHERE id = NEW.service_id AND is_active;
    IF price IS NULL THEN RAISE EXCEPTION 'That service is unavailable'; END IF;
    SELECT COALESCE(p.discount_percentage, 0) INTO disc
      FROM public.memberships m JOIN public.membership_plans p ON p.id = m.plan_id
     WHERE m.user_id = uid AND m.status IN ('active','pending')
     ORDER BY p.tier_rank DESC LIMIT 1;
    disc := COALESCE(disc, 0);
    NEW.status := 'pending';
    NEW.technician_id := NULL;
    NEW.cancelled_at := NULL;
    NEW.base_price_cents := price;
    NEW.discount_percentage := disc;
    NEW.total_price_cents := ROUND(price * (1 - disc / 100));
    RETURN NEW;
  END IF;

  -- Customer updates: only cancel, or reschedule an upcoming booking.
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.service_id IS DISTINCT FROM OLD.service_id
     OR NEW.membership_id IS DISTINCT FROM OLD.membership_id
     OR NEW.technician_id IS DISTINCT FROM OLD.technician_id
     OR NEW.base_price_cents IS DISTINCT FROM OLD.base_price_cents
     OR NEW.discount_percentage IS DISTINCT FROM OLD.discount_percentage
     OR NEW.total_price_cents IS DISTINCT FROM OLD.total_price_cents
     OR NEW.duration_minutes IS DISTINCT FROM OLD.duration_minutes THEN
    RAISE EXCEPTION 'You can only cancel or reschedule your booking';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'cancelled' THEN
    RAISE EXCEPTION 'Only our team can change a booking status';
  END IF;
  IF OLD.status NOT IN ('pending','confirmed') AND
     (NEW.status IS DISTINCT FROM OLD.status OR NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at) THEN
    RAISE EXCEPTION 'This appointment can no longer be changed';
  END IF;
  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.guard_booking_write() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS bookings_guard_write ON public.bookings;
CREATE TRIGGER bookings_guard_write BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.guard_booking_write();