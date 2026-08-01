REVOKE ALL ON FUNCTION public.sync_membership_cycle(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_membership_cycle(uuid) TO service_role;