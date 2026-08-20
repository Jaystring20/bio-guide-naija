ALTER FUNCTION public.delete_email(text, bigint) SET search_path = '';
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = '';
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = '';
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = '';

REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.email_queue_dispatch() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.email_queue_wake() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.support_issues_status_change() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;

REVOKE ALL ON FUNCTION public.admin_get_result_owner(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.admin_list_feedback(integer) FROM anon, public;
REVOKE ALL ON FUNCTION public.admin_list_issues(integer) FROM anon, public;
REVOKE ALL ON FUNCTION public.admin_list_users() FROM anon, public;
REVOKE ALL ON FUNCTION public.admin_overview_metrics() FROM anon, public;
REVOKE ALL ON FUNCTION public.admin_recent_results(integer) FROM anon, public;
REVOKE ALL ON FUNCTION public.admin_user_issue_history(uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.admin_get_result_owner(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_feedback(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_issues(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_overview_metrics() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_recent_results(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_user_issue_history(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;