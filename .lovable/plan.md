## Why users aren't loading

The Control Room / Users tab calls the `admin_list_users()` Postgres function. That function declares an OUT parameter named `user_id` (because of `RETURNS TABLE(user_id uuid, …)`) **and** has two inline subqueries (`r` and `d`) that each also expose a column named `user_id`. Inside the join condition `ON r.user_id = u.id`, Postgres can't tell which `user_id` you mean — the OUT parameter or the subquery column — so it raises:

```
column reference "user_id" is ambiguous
```

That's the red banner you're seeing. It has nothing to do with RLS or auth — the SQL itself is broken.

## The fix

Rewrite `public.admin_list_users()` so the subquery columns are renamed (e.g. `uid` instead of `user_id`), removing the collision with the function's OUT parameter. Behaviour, return shape, and the admin role check stay identical.

### Migration (SQL)

```sql
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
    SELECT lr.user_id  AS uid,
           COUNT(*)    AS cnt,
           MAX(lr.upload_date) AS last_upload
    FROM public.lab_results lr
    GROUP BY lr.user_id
  ) r ON r.uid = u.id
  LEFT JOIN (
    SELECT dp.user_id AS uid,
           COUNT(*)   AS cnt
    FROM public.dependants dp
    GROUP BY dp.user_id
  ) d ON d.uid = u.id
  ORDER BY u.created_at DESC;
END;
$$;
```

## What I'll do once approved

1. Run the migration above to replace `admin_list_users()` with the unambiguous version.
2. No frontend changes needed — `AdminDashboard.tsx` and the new `ControlRoom.tsx` already consume the same return shape.
3. Quick verification by calling the RPC and checking that the Users tab + Control Room render rows again.

## Out of scope (intentionally)

- No changes to RLS, roles, auth flow, or any other RPC.
- No UI changes — the existing "Failed to load users" toast simply won't fire anymore once the SQL succeeds.
