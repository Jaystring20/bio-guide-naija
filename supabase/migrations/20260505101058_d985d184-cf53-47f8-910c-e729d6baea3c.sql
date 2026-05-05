ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

DROP FUNCTION IF EXISTS public.admin_get_result_owner(uuid);

CREATE FUNCTION public.admin_get_result_owner(_result_id uuid)
  RETURNS TABLE(user_id uuid, email text, full_name text, phone text)
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
    COALESCE(p.full_name, '')::text,
    p.phone
  FROM public.lab_results lr
  LEFT JOIN auth.users u ON u.id = lr.user_id
  LEFT JOIN public.profiles p ON p.user_id = lr.user_id
  WHERE lr.id = _result_id
  LIMIT 1;
END;
$function$;