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
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    u.id                              AS user_id,
    u.email::text,
    COALESCE(p.full_name, '')::text   AS full_name,
    u.created_at,
    u.last_sign_in_at                 AS last_sign_in,
    COALESCE(r.cnt, 0)                AS results_count,
    COALESCE(d.cnt, 0)                AS dependants_count,
    r.last_upload                     AS last_activity
  FROM auth.users u
  LEFT JOIN public.profiles p
    ON p.user_id = u.id
  LEFT JOIN (
    SELECT lr.user_id          AS uid,
           COUNT(*)             AS cnt,
           MAX(lr.upload_date)  AS last_upload
    FROM public.lab_results lr
    GROUP BY lr.user_id
  ) r ON r.uid = u.id
  LEFT JOIN (
    SELECT dp.user_id AS uid,
           COUNT(*)    AS cnt
    FROM public.dependants dp
    GROUP BY dp.user_id
  ) d ON d.uid = u.id
  ORDER BY u.created_at DESC;
END;
$$;