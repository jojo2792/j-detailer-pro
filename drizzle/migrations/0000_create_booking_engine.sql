-- Booking engine: services catalogue, customer vehicles, bookings.

CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');

CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'detailing',
  duration_minutes integer NOT NULL DEFAULT 90,
  base_price_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'TTD',
  includes jsonb NOT NULL DEFAULT '[]'::jsonb,
  membership_covered boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active services" ON public.services
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE TRIGGER services_set_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_type text NOT NULL DEFAULT 'car',
  make text NOT NULL,
  model text NOT NULL,
  year integer,
  color text,
  plate text,
  notes text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX vehicles_user_id_idx ON public.vehicles (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own vehicles" ON public.vehicles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vehicles" ON public.vehicles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vehicles" ON public.vehicles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own vehicles" ON public.vehicles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Staff can read all vehicles" ON public.vehicles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technician'));

CREATE TRIGGER vehicles_set_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id),
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  membership_id uuid REFERENCES public.memberships(id) ON DELETE SET NULL,
  status public.booking_status NOT NULL DEFAULT 'pending',
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 90,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  address_line text NOT NULL,
  city text NOT NULL,
  notes text,
  vehicle_summary text,
  base_price_cents integer NOT NULL DEFAULT 0,
  discount_percentage numeric NOT NULL DEFAULT 0,
  total_price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'TTD',
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX bookings_user_id_idx ON public.bookings (user_id);
CREATE INDEX bookings_scheduled_at_idx ON public.bookings (scheduled_at);

-- Duplicate-slot prevention: one live booking per start time.
CREATE UNIQUE INDEX bookings_unique_live_slot
  ON public.bookings (scheduled_at)
  WHERE status <> 'cancelled';

GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bookings" ON public.bookings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own bookings" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff can read all bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technician'));
CREATE POLICY "Staff can update all bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technician'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technician'));

CREATE TRIGGER bookings_set_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.services (slug, name, description, category, duration_minutes, base_price_cents, includes, membership_covered, sort_order)
VALUES
  ('exterior-detail', 'Exterior Detail', 'Foam wash, wheels, tyres, glass and spray protection.', 'detailing', 90, 18000,
   '["Foam wash","Wheel cleaning","Tire dressing","Exterior glass","Spray protection"]'::jsonb, true, 1),
  ('interior-detail', 'Interior Detail', 'Full interior vacuum, surfaces, glass and protection.', 'detailing', 90, 22000,
   '["Vacuum","Dashboard cleaning","Plastic protection","Glass cleaning","Door jambs"]'::jsonb, true, 2),
  ('premium-full-detail', 'Premium Full Detail', 'Complete inside and out restoration of your vehicle.', 'detailing', 180, 38000,
   '["Complete interior detail","Complete exterior detail","Wheels & tires","All glass surfaces","Interior protection"]'::jsonb, false, 3),
  ('paint-correction', 'Paint Correction', 'Machine polishing to remove swirls and restore gloss.', 'correction', 480, 90000,
   '["Paint inspection","Multi-stage machine polish","Swirl removal","Gloss enhancement"]'::jsonb, false, 4),
  ('ceramic-coating', 'Ceramic Coating', 'Long-term ceramic or graphene paint protection.', 'protection', 480, 180000,
   '["Full paint prep","Coating application","Cure supervision","Aftercare kit"]'::jsonb, false, 5),
  ('add-on-services', 'Add-On Services', 'Engine bay, headlights, leather care and odour removal.', 'addon', 60, 8000,
   '["Engine bay cleaning","Headlight restoration","Leather conditioning","Odor removal"]'::jsonb, false, 6);
