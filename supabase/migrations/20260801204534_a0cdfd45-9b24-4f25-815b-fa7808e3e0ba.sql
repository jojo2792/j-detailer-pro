-- ============================================================
-- 1. Shared helpers
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. Roles
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('customer', 'technician', 'admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'customer',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 3. Profiles
-- ============================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + default customer role on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 4. Membership plans
-- ============================================================
CREATE TABLE public.membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  monthly_price_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'TTD',
  monthly_wash_limit integer NOT NULL DEFAULT 0,
  monthly_interior_limit integer NOT NULL DEFAULT 0,
  discount_percentage numeric(5,2) NOT NULL DEFAULT 0,
  reward_multiplier numeric(4,2) NOT NULL DEFAULT 1,
  vehicle_limit integer NOT NULL DEFAULT 1,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  limits jsonb NOT NULL DEFAULT '[]'::jsonb,
  tier_rank integer NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  requires_quote boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.membership_plans TO anon;
GRANT SELECT ON public.membership_plans TO authenticated;
GRANT ALL ON public.membership_plans TO service_role;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active plans"
  ON public.membership_plans FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE TRIGGER membership_plans_set_updated_at
  BEFORE UPDATE ON public.membership_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.membership_plans
  (slug, name, tagline, monthly_price_cents, monthly_wash_limit, monthly_interior_limit,
   discount_percentage, reward_multiplier, vehicle_limit, tier_rank, is_featured, requires_quote, features, limits)
VALUES
  ('essential', 'Essential', 'Great starter plan', 29900, 2, 0, 10, 2, 1, 1, false, false,
   '["2 Maintenance Washes","Interior Vacuum","Dashboard Wipe","Tire Shine","Glass Cleaning","10% Service Discount","Double Reward Points"]'::jsonb,
   '["Max 2 visits monthly","One registered vehicle","No rollover visits"]'::jsonb),
  ('premium', 'Premium', 'Most popular', 49900, 4, 1, 15, 2, 1, 2, true, false,
   '["4 Maintenance Washes","Premium Interior Detail","Spray Sealant","Priority Booking","15% Service Discount","Double Reward Points"]'::jsonb,
   '["Max 4 visits monthly","One registered vehicle","No rollover visits"]'::jsonb),
  ('platinum', 'Platinum', 'The full experience', 79900, 5, 2, 20, 3, 1, 3, false, false,
   '["5 Maintenance Washes","2 Deep Interior Cleans","Ceramic Booster","Rain Repellent","Priority Scheduling","20% Service Discount","Triple Reward Points","Annual Paint Inspection"]'::jsonb,
   '["Max 5 maintenance visits","Max 2 interior details","One registered vehicle"]'::jsonb),
  ('family', 'Family', '3 vehicles', 99900, 8, 2, 15, 2, 3, 4, false, false,
   '["3 Registered Vehicles","8 Shared Maintenance Washes","15% Service Discount","Priority Scheduling","Double Reward Points"]'::jsonb,
   '["8 shared washes/month","Up to 3 vehicles","No rollover visits"]'::jsonb),
  ('fleet', 'Fleet', '5+ vehicles, custom', 0, 0, 0, 20, 2, 5, 5, false, true,
   '["5+ Registered Vehicles","Dedicated Account Manager","Monthly Reporting","Flexible Billing","Custom Visit Allowance"]'::jsonb,
   '["Custom allowance agreed per contract","Minimum 5 vehicles"]'::jsonb);

-- ============================================================
-- 5. Memberships
-- ============================================================
CREATE TYPE public.membership_status AS ENUM ('pending', 'active', 'paused', 'cancelled', 'expired');

CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.membership_plans(id),
  status public.membership_status NOT NULL DEFAULT 'pending',
  auto_renew boolean NOT NULL DEFAULT true,
  started_at timestamptz NOT NULL DEFAULT now(),
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL DEFAULT (now() + interval '1 month'),
  renewal_date timestamptz NOT NULL DEFAULT (now() + interval '1 month'),
  washes_used integer NOT NULL DEFAULT 0,
  interior_details_used integer NOT NULL DEFAULT 0,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  paused_at timestamptz,
  resumes_at timestamptz,
  cancelled_at timestamptz,
  pending_plan_id uuid REFERENCES public.membership_plans(id),
  billing_provider text,
  billing_subscription_id text,
  billing_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX memberships_one_live_per_user
  ON public.memberships (user_id)
  WHERE status IN ('pending', 'active', 'paused');

CREATE INDEX memberships_user_idx ON public.memberships (user_id);
CREATE INDEX memberships_status_period_idx ON public.memberships (status, current_period_end);

GRANT SELECT, INSERT, UPDATE ON public.memberships TO authenticated;
GRANT ALL ON public.memberships TO service_role;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own membership"
  ON public.memberships FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all memberships"
  ON public.memberships FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own membership"
  ON public.memberships FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own membership"
  ON public.memberships FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all memberships"
  ON public.memberships FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER memberships_set_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Guard: usage can never exceed the plan allowance (validation trigger, not CHECK)
CREATE OR REPLACE FUNCTION public.validate_membership_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  wash_limit integer;
  interior_limit integer;
BEGIN
  SELECT monthly_wash_limit, monthly_interior_limit
    INTO wash_limit, interior_limit
  FROM public.membership_plans WHERE id = NEW.plan_id;

  IF NEW.washes_used < 0 OR NEW.interior_details_used < 0 THEN
    RAISE EXCEPTION 'Usage counters cannot be negative';
  END IF;

  IF wash_limit > 0 AND NEW.washes_used > wash_limit THEN
    RAISE EXCEPTION 'Wash allowance exceeded for this billing cycle';
  END IF;

  IF interior_limit > 0 AND NEW.interior_details_used > interior_limit THEN
    RAISE EXCEPTION 'Interior detail allowance exceeded for this billing cycle';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER memberships_validate_usage
  BEFORE INSERT OR UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.validate_membership_usage();

-- ============================================================
-- 6. Membership history (audit trail)
-- ============================================================
CREATE TYPE public.membership_event AS ENUM (
  'created', 'activated', 'upgraded', 'downgraded', 'paused', 'resumed',
  'cancelled', 'renewed', 'cycle_reset', 'usage_recorded', 'auto_renew_changed', 'expired'
);

CREATE TABLE public.membership_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event public.membership_event NOT NULL,
  from_plan_id uuid REFERENCES public.membership_plans(id),
  to_plan_id uuid REFERENCES public.membership_plans(id),
  note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX membership_history_user_idx ON public.membership_history (user_id, created_at DESC);
CREATE INDEX membership_history_membership_idx ON public.membership_history (membership_id, created_at DESC);

GRANT SELECT ON public.membership_history TO authenticated;
GRANT ALL ON public.membership_history TO service_role;
ALTER TABLE public.membership_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own membership history"
  ON public.membership_history FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all membership history"
  ON public.membership_history FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.log_membership_event(
  _membership_id uuid,
  _event public.membership_event,
  _from_plan_id uuid DEFAULT NULL,
  _to_plan_id uuid DEFAULT NULL,
  _note text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
BEGIN
  SELECT user_id INTO _user_id FROM public.memberships WHERE id = _membership_id;
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Membership not found';
  END IF;

  INSERT INTO public.membership_history
    (membership_id, user_id, event, from_plan_id, to_plan_id, note, metadata)
  VALUES (_membership_id, _user_id, _event, _from_plan_id, _to_plan_id, _note, _metadata);
END;
$$;

-- ============================================================
-- 7. Automatic billing-cycle reset
-- ============================================================
-- Rolls a membership's billing period forward and zeroes monthly usage for
-- every period that has already elapsed. Idempotent and safe to call on read.
CREATE OR REPLACE FUNCTION public.sync_membership_cycle(_membership_id uuid)
RETURNS public.memberships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m public.memberships;
  cycles integer := 0;
  new_start timestamptz;
  new_end timestamptz;
BEGIN
  SELECT * INTO m FROM public.memberships WHERE id = _membership_id FOR UPDATE;
  IF m.id IS NULL THEN
    RAISE EXCEPTION 'Membership not found';
  END IF;

  -- Paused memberships freeze their cycle; nothing to roll forward.
  IF m.status NOT IN ('active', 'pending') OR m.current_period_end > now() THEN
    RETURN m;
  END IF;

  new_start := m.current_period_start;
  new_end := m.current_period_end;

  WHILE new_end <= now() AND cycles < 240 LOOP
    new_start := new_end;
    new_end := new_end + interval '1 month';
    cycles := cycles + 1;
  END LOOP;

  IF m.cancel_at_period_end THEN
    UPDATE public.memberships
       SET status = 'cancelled',
           cancelled_at = COALESCE(cancelled_at, m.current_period_end),
           auto_renew = false
     WHERE id = m.id
    RETURNING * INTO m;

    PERFORM public.log_membership_event(m.id, 'expired', NULL, NULL, 'Cancellation took effect at period end');
    RETURN m;
  END IF;

  IF NOT m.auto_renew THEN
    UPDATE public.memberships
       SET status = 'expired'
     WHERE id = m.id
    RETURNING * INTO m;

    PERFORM public.log_membership_event(m.id, 'expired', NULL, NULL, 'Auto renewal was disabled');
    RETURN m;
  END IF;

  UPDATE public.memberships
     SET current_period_start = new_start,
         current_period_end = new_end,
         renewal_date = new_end,
         washes_used = 0,
         interior_details_used = 0,
         status = 'active',
         plan_id = COALESCE(pending_plan_id, plan_id),
         pending_plan_id = NULL
   WHERE id = m.id
  RETURNING * INTO m;

  PERFORM public.log_membership_event(
    m.id, 'cycle_reset', NULL, NULL,
    'Monthly allowances reset for the new billing cycle',
    jsonb_build_object('cycles_advanced', cycles, 'period_start', new_start, 'period_end', new_end)
  );

  RETURN m;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_membership_cycle(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.sync_membership_cycle(uuid) TO authenticated, service_role;

-- Records usage of a monthly visit, enforcing the plan allowance.
CREATE OR REPLACE FUNCTION public.record_membership_usage(
  _membership_id uuid,
  _kind text,
  _quantity integer DEFAULT 1
)
RETURNS public.memberships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m public.memberships;
BEGIN
  IF _kind NOT IN ('wash', 'interior') THEN
    RAISE EXCEPTION 'Unknown usage kind: %', _kind;
  END IF;
  IF _quantity IS NULL OR _quantity < 1 THEN
    RAISE EXCEPTION 'Quantity must be at least 1';
  END IF;

  m := public.sync_membership_cycle(_membership_id);

  IF m.status <> 'active' THEN
    RAISE EXCEPTION 'Membership is not active';
  END IF;

  IF _kind = 'wash' THEN
    UPDATE public.memberships
       SET washes_used = washes_used + _quantity
     WHERE id = _membership_id RETURNING * INTO m;
  ELSE
    UPDATE public.memberships
       SET interior_details_used = interior_details_used + _quantity
     WHERE id = _membership_id RETURNING * INTO m;
  END IF;

  PERFORM public.log_membership_event(
    m.id, 'usage_recorded', NULL, NULL, NULL,
    jsonb_build_object('kind', _kind, 'quantity', _quantity)
  );

  RETURN m;
END;
$$;

REVOKE ALL ON FUNCTION public.record_membership_usage(uuid, text, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.record_membership_usage(uuid, text, integer) TO service_role;

-- Batch reset for a future scheduled job / billing worker.
CREATE OR REPLACE FUNCTION public.reset_due_membership_cycles()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  n integer := 0;
BEGIN
  FOR r IN
    SELECT id FROM public.memberships
    WHERE status IN ('active', 'pending') AND current_period_end <= now()
    LIMIT 5000
  LOOP
    PERFORM public.sync_membership_cycle(r.id);
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_due_membership_cycles() FROM public;
GRANT EXECUTE ON FUNCTION public.reset_due_membership_cycles() TO service_role;