-- Feedback table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bug','suggestion','praise','confusion','feature_request','other')),
  rating SMALLINT CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
  nps SMALLINT CHECK (nps IS NULL OR (nps BETWEEN 0 AND 10)),
  message TEXT NOT NULL,
  screen TEXT,
  result_id UUID,
  device_info JSONB,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','actioned','wont_fix')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
  ON public.feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
  ON public.feedback FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update feedback"
  ON public.feedback FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_feedback_updated_at
BEFORE UPDATE ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_feedback_created_at ON public.feedback (created_at DESC);
CREATE INDEX idx_feedback_status ON public.feedback (status);
CREATE INDEX idx_feedback_category ON public.feedback (category);

-- Extend admin overview metrics
CREATE OR REPLACE FUNCTION public.admin_overview_metrics()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'total_profiles', (SELECT COUNT(*) FROM public.profiles),
    'total_dependants', (SELECT COUNT(*) FROM public.dependants),
    'total_results', (SELECT COUNT(*) FROM public.lab_results),
    'results_7d', (SELECT COUNT(*) FROM public.lab_results WHERE upload_date >= now() - interval '7 days'),
    'results_30d', (SELECT COUNT(*) FROM public.lab_results WHERE upload_date >= now() - interval '30 days'),
    'critical_total', (SELECT COUNT(*) FROM public.lab_results WHERE has_critical_alert = true),
    'critical_30d', (SELECT COUNT(*) FROM public.lab_results WHERE has_critical_alert = true AND upload_date >= now() - interval '30 days'),
    'failed_30d', (SELECT COUNT(*) FROM public.lab_results WHERE status = 'failed' AND upload_date >= now() - interval '30 days'),
    'completed_30d', (SELECT COUNT(*) FROM public.lab_results WHERE status = 'completed' AND upload_date >= now() - interval '30 days'),
    'active_users_30d', (SELECT COUNT(DISTINCT user_id) FROM public.lab_results WHERE upload_date >= now() - interval '30 days'),
    'feedback_total', (SELECT COUNT(*) FROM public.feedback),
    'feedback_7d', (SELECT COUNT(*) FROM public.feedback WHERE created_at >= now() - interval '7 days'),
    'feedback_unresolved_bugs', (SELECT COUNT(*) FROM public.feedback WHERE category = 'bug' AND status IN ('new','reviewed')),
    'avg_rating_30d', (SELECT ROUND(AVG(rating)::numeric, 2) FROM public.feedback WHERE rating IS NOT NULL AND created_at >= now() - interval '30 days'),
    'avg_nps_30d', (SELECT ROUND(AVG(nps)::numeric, 2) FROM public.feedback WHERE nps IS NOT NULL AND created_at >= now() - interval '30 days'),
    'daily_uploads', (
      SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.day), '[]'::jsonb)
      FROM (
        SELECT date_trunc('day', upload_date)::date AS day, COUNT(*) AS count
        FROM public.lab_results
        WHERE upload_date >= now() - interval '30 days'
        GROUP BY 1
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$function$;

-- Admin lookup of a result's owner (for the admin viewer banner)
CREATE OR REPLACE FUNCTION public.admin_get_result_owner(_result_id uuid)
 RETURNS TABLE(user_id uuid, email text, full_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    lr.user_id,
    u.email::text,
    COALESCE(p.full_name, '')::text
  FROM public.lab_results lr
  LEFT JOIN auth.users u ON u.id = lr.user_id
  LEFT JOIN public.profiles p ON p.user_id = lr.user_id
  WHERE lr.id = _result_id
  LIMIT 1;
END;
$function$;

-- Admin list of feedback with user info
CREATE OR REPLACE FUNCTION public.admin_list_feedback(_limit integer DEFAULT 200)
 RETURNS TABLE(
   id uuid, user_id uuid, email text, full_name text,
   category text, rating smallint, nps smallint, message text,
   screen text, result_id uuid, device_info jsonb,
   status text, admin_notes text, created_at timestamptz
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    f.id, f.user_id, u.email::text, COALESCE(p.full_name, '')::text,
    f.category, f.rating, f.nps, f.message,
    f.screen, f.result_id, f.device_info,
    f.status, f.admin_notes, f.created_at
  FROM public.feedback f
  LEFT JOIN auth.users u ON u.id = f.user_id
  LEFT JOIN public.profiles p ON p.user_id = f.user_id
  ORDER BY f.created_at DESC
  LIMIT _limit;
END;
$function$;