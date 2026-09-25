CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('booking_created','booking_status','booking_cancelled','booking_rescheduled')),
  title text NOT NULL,
  body text NOT NULL,
  channel text NOT NULL DEFAULT 'in_app',
  delivery_status text NOT NULL DEFAULT 'in_app_only' CHECK (delivery_status IN ('in_app_only','pending','sent','failed')),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_created_idx ON public.notifications (user_id, created_at DESC);

GRANT SELECT ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all notifications" ON public.notifications
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.mark_my_notifications_read(_ids uuid[] DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  UPDATE public.notifications SET read_at = now()
   WHERE user_id = auth.uid() AND read_at IS NULL AND (_ids IS NULL OR id = ANY(_ids));
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.mark_my_notifications_read(uuid[]) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.mark_my_notifications_read(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_booking_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  svc text;
  when_txt text;
  status_label text;
BEGIN
  SELECT name INTO svc FROM public.services WHERE id = NEW.service_id;
  svc := COALESCE(svc, 'Detailing service');
  when_txt := to_char(NEW.scheduled_at AT TIME ZONE 'America/Port_of_Spain', 'Dy DD Mon, HH12:MI AM');

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, booking_id, kind, title, body)
    VALUES (NEW.user_id, NEW.id, 'booking_created', 'Booking received — ' || NEW.reference,
            svc || ' requested for ' || when_txt || '. We''ll confirm shortly.');
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'cancelled' THEN
      INSERT INTO public.notifications (user_id, booking_id, kind, title, body)
      VALUES (NEW.user_id, NEW.id, 'booking_cancelled', 'Booking cancelled — ' || NEW.reference,
              'Your ' || svc || ' on ' || when_txt || ' has been cancelled.');
    ELSE
      status_label := CASE NEW.status
        WHEN 'confirmed' THEN 'confirmed'
        WHEN 'in_progress' THEN 'in progress'
        WHEN 'completed' THEN 'completed'
        ELSE NEW.status::text END;
      INSERT INTO public.notifications (user_id, booking_id, kind, title, body)
      VALUES (NEW.user_id, NEW.id, 'booking_status', 'Booking ' || status_label || ' — ' || NEW.reference,
              'Your ' || svc || ' on ' || when_txt || ' is now ' || status_label || '.');
    END IF;
  ELSIF NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at THEN
    INSERT INTO public.notifications (user_id, booking_id, kind, title, body)
    VALUES (NEW.user_id, NEW.id, 'booking_rescheduled', 'Booking rescheduled — ' || NEW.reference,
            'Your ' || svc || ' has moved to ' || when_txt || '.');
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.notify_booking_change() FROM anon, authenticated, public;

CREATE TRIGGER bookings_notify_insert AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_booking_change();
CREATE TRIGGER bookings_notify_update AFTER UPDATE OF status, scheduled_at ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_booking_change();