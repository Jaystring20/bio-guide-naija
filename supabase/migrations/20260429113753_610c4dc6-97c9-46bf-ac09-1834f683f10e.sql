REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_overview_metrics() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_recent_results(int) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_overview_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_recent_results(int) TO authenticated;