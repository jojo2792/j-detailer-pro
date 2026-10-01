CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target uuid;
BEGIN
  SELECT id INTO target FROM auth.users WHERE lower(email) = lower(trim(_email)) LIMIT 1;
  IF target IS NULL THEN
    RAISE EXCEPTION 'No account exists for that email. The person must sign up first.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target AND role = 'admin') THEN
    RETURN 'already_admin';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'An admin already exists. Use the Team page to grant further access.';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (target, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN 'granted';
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_first_admin(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin(text) TO service_role;
COMMENT ON FUNCTION public.bootstrap_first_admin(text) IS 'Operator-only: designates the first admin by email. Refuses once any admin exists; idempotent for the same user.';