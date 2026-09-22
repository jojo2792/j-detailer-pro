-- 1. Reward points per service (additive, does not touch pricing)
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS reward_points integer NOT NULL DEFAULT 0;

UPDATE public.services SET reward_points = 100 WHERE slug = 'exterior-detail';
UPDATE public.services SET reward_points = 150 WHERE slug = 'interior-detail';
UPDATE public.services SET reward_points = 250 WHERE slug = 'premium-full-detail';
UPDATE public.services SET reward_points = 750 WHERE slug = 'paint-correction';
UPDATE public.services SET reward_points = 1000 WHERE slug = 'ceramic-coating';

-- 2. Redemption catalogue (published options only)
CREATE TABLE public.reward_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  points_cost integer NOT NULL CHECK (points_cost > 0),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.reward_catalog TO anon;
GRANT SELECT ON public.reward_catalog TO authenticated;
GRANT ALL ON public.reward_catalog TO service_role;

ALTER TABLE public.reward_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active rewards"
ON public.reward_catalog FOR SELECT TO anon, authenticated
USING (is_active = true);

CREATE TRIGGER reward_catalog_set_updated_at
BEFORE UPDATE ON public.reward_catalog
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.reward_catalog (slug, name, points_cost, sort_order) VALUES
  ('tire-shine-upgrade', 'Tire Shine Upgrade', 500, 1),
  ('free-engine-bay-cleaning', 'Free Engine Bay Cleaning', 1000, 2),
  ('free-interior-shampoo', 'Free Interior Shampoo', 2000, 3),
  ('free-maintenance-wash', 'Free Maintenance Wash', 3000, 4),
  ('service-credit-250', 'TT$250 Service Credit', 5000, 5);

-- 3. Ledger
CREATE TABLE public.reward_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('earn', 'redeem', 'adjustment')),
  points integer NOT NULL,
  description text NOT NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  catalog_id uuid REFERENCES public.reward_catalog(id) ON DELETE SET NULL,
  multiplier numeric NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX reward_transactions_unique_booking_earn
  ON public.reward_transactions (booking_id) WHERE kind = 'earn' AND booking_id IS NOT NULL;
CREATE INDEX reward_transactions_user_created_idx
  ON public.reward_transactions (user_id, created_at DESC);

GRANT SELECT ON public.reward_transactions TO authenticated;
GRANT ALL ON public.reward_transactions TO service_role;

ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reward transactions"
ON public.reward_transactions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all reward transactions"
ON public.reward_transactions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Balance helper
CREATE OR REPLACE FUNCTION public.reward_balance(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(points), 0)::integer
  FROM public.reward_transactions
  WHERE user_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.my_reward_balance()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.reward_balance(auth.uid());
$$;

GRANT EXECUTE ON FUNCTION public.my_reward_balance() TO authenticated;

-- 5. Awarding on booking completion (server-side only, idempotent)
CREATE OR REPLACE FUNCTION public.award_booking_rewards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_points integer := 0;
  service_name text;
  mult numeric := 1;
  total integer;
BEGIN
  IF NEW.status <> 'completed' OR (OLD.status IS NOT NULL AND OLD.status = 'completed') THEN
    RETURN NEW;
  END IF;

  SELECT s.reward_points, s.name INTO base_points, service_name
  FROM public.services s WHERE s.id = NEW.service_id;

  IF COALESCE(base_points, 0) <= 0 THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(p.reward_multiplier, 1) INTO mult
  FROM public.memberships m
  JOIN public.membership_plans p ON p.id = m.plan_id
  WHERE m.user_id = NEW.user_id AND m.status = 'active'
  ORDER BY p.tier_rank DESC
  LIMIT 1;

  mult := COALESCE(mult, 1);
  total := FLOOR(base_points * mult)::integer;

  INSERT INTO public.reward_transactions
    (user_id, kind, points, description, booking_id, multiplier)
  VALUES
    (NEW.user_id, 'earn', total,
     COALESCE(service_name, 'Detailing service') || ' completed',
     NEW.id, mult)
  ON CONFLICT (booking_id) WHERE kind = 'earn' AND booking_id IS NOT NULL DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_award_rewards
AFTER UPDATE OF status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.award_booking_rewards();

-- 6. Atomic redemption for the signed-in owner only
CREATE OR REPLACE FUNCTION public.redeem_reward(_catalog_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  item public.reward_catalog;
  current_balance integer;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to redeem rewards';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(uid::text, 0));

  SELECT * INTO item FROM public.reward_catalog
  WHERE id = _catalog_id AND is_active = true;
  IF item.id IS NULL THEN
    RAISE EXCEPTION 'That reward is unavailable';
  END IF;

  SELECT COALESCE(SUM(points), 0)::integer INTO current_balance
  FROM public.reward_transactions WHERE user_id = uid;

  IF current_balance < item.points_cost THEN
    RAISE EXCEPTION 'Not enough points to redeem this reward';
  END IF;

  INSERT INTO public.reward_transactions
    (user_id, kind, points, description, catalog_id)
  VALUES (uid, 'redeem', -item.points_cost, 'Redeemed ' || item.name, item.id);

  RETURN current_balance - item.points_cost;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_reward(uuid) TO authenticated;