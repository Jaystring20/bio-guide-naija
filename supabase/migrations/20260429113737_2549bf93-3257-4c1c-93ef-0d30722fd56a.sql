-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security-definer role check
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
  )
$$;

-- RLS policies on user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin SELECT policies on existing tables (additive)
CREATE POLICY "Admins can view all lab results"
  ON public.lab_results FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all dependants"
  ON public.dependants FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin RPC: list users with stats + email from auth.users
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  last_sign_in timestamptz,
  results_count bigint,
  dependants_count bigint,
  last_activity timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.email::text,
    COALESCE(p.full_name, '')::text AS full_name,
    u.created_at,
    u.last_sign_in_at AS last_sign_in,
    COALESCE(r.cnt, 0) AS results_count,
    COALESCE(d.cnt, 0) AS dependants_count,
    r.last_upload AS last_activity
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS cnt, MAX(upload_date) AS last_upload
    FROM public.lab_results GROUP BY user_id
  ) r ON r.user_id = u.id
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS cnt
    FROM public.dependants GROUP BY user_id
  ) d ON d.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

-- Admin RPC: aggregate metrics
CREATE OR REPLACE FUNCTION public.admin_overview_metrics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Admin RPC: recent uploads with user email
CREATE OR REPLACE FUNCTION public.admin_recent_results(_limit int DEFAULT 50)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  full_name text,
  status text,
  has_critical_alert boolean,
  upload_date timestamptz,
  dependant_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    lr.id, lr.user_id, u.email::text, COALESCE(p.full_name, '')::text,
    lr.status, lr.has_critical_alert, lr.upload_date, lr.dependant_id
  FROM public.lab_results lr
  LEFT JOIN auth.users u ON u.id = lr.user_id
  LEFT JOIN public.profiles p ON p.user_id = lr.user_id
  ORDER BY lr.upload_date DESC
  LIMIT _limit;
END;
$$;

-- Seed first admin (user with most uploads — change later from the UI)
INSERT INTO public.user_roles (user_id, role)
VALUES ('8a559b6c-66a8-42c4-93d4-1c35a4f4a4cd', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;