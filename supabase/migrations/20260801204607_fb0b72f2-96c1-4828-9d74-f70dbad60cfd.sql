REVOKE ALL ON FUNCTION public.set_updated_at() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_membership_usage() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_membership_event(uuid, public.membership_event, uuid, uuid, text, jsonb) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
REVOKE ALL ON FUNCTION public.sync_membership_cycle(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.record_membership_usage(uuid, text, integer) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.reset_due_membership_cycles() FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sync_membership_cycle(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_membership_event(uuid, public.membership_event, uuid, uuid, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_membership_usage(uuid, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_due_membership_cycles() TO service_role;