-- Issue tracking tables
CREATE TABLE public.support_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affected_user_id UUID NOT NULL,
  lab_result_id UUID NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  source TEXT NOT NULL DEFAULT 'admin_created',
  assigned_to UUID NULL,
  created_by UUID NOT NULL,
  resolution_summary TEXT NULL,
  resolution_action TEXT NULL,
  resolved_at TIMESTAMPTZ NULL,
  resolved_by UUID NULL,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT support_issues_status_chk CHECK (status IN ('open','in_progress','waiting_user','resolved','closed','reopened')),
  CONSTRAINT support_issues_priority_chk CHECK (priority IN ('low','normal','high','urgent')),
  CONSTRAINT support_issues_category_chk CHECK (category IN ('processing_delay','failed_extraction','diet_missing','critical_followup','upload_error','account','other')),
  CONSTRAINT support_issues_source_chk CHECK (source IN ('admin_created','user_feedback','auto_detected'))
);

CREATE INDEX idx_support_issues_affected_user ON public.support_issues(affected_user_id);
CREATE INDEX idx_support_issues_lab_result ON public.support_issues(lab_result_id);
CREATE INDEX idx_support_issues_status ON public.support_issues(status);
CREATE INDEX idx_support_issues_assigned_to ON public.support_issues(assigned_to);
CREATE INDEX idx_support_issues_created_at ON public.support_issues(created_at DESC);

CREATE TABLE public.support_issue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.support_issues(id) ON DELETE CASCADE,
  actor_id UUID NULL,
  event_type TEXT NOT NULL,
  from_status TEXT NULL,
  to_status TEXT NULL,
  note TEXT NULL,
  action_key TEXT NULL,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT support_issue_events_type_chk CHECK (event_type IN ('note','status_change','assignment','action_taken','linked_action','created'))
);

CREATE INDEX idx_support_issue_events_issue ON public.support_issue_events(issue_id, created_at DESC);

-- RLS
ALTER TABLE public.support_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_issue_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view issues" ON public.support_issues FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert issues" ON public.support_issues FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update issues" ON public.support_issues FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete issues" ON public.support_issues FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view issue events" ON public.support_issue_events FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert issue events" ON public.support_issue_events FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE TRIGGER trg_support_issues_updated_at
BEFORE UPDATE ON public.support_issues
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Status change auto-event + resolved fields
CREATE OR REPLACE FUNCTION public.support_issues_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.support_issue_events(issue_id, actor_id, event_type, to_status, note)
    VALUES (NEW.id, NEW.created_by, 'created', NEW.status, NEW.description);
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'resolved' AND OLD.status <> 'resolved' THEN
      NEW.resolved_at := COALESCE(NEW.resolved_at, now());
      NEW.resolved_by := COALESCE(NEW.resolved_by, auth.uid());
    ELSIF NEW.status = 'reopened' THEN
      NEW.resolved_at := NULL;
      NEW.resolved_by := NULL;
    END IF;

    INSERT INTO public.support_issue_events(issue_id, actor_id, event_type, from_status, to_status, note)
    VALUES (NEW.id, auth.uid(), 'status_change', OLD.status, NEW.status,
            CASE WHEN NEW.status = 'resolved' THEN NEW.resolution_summary ELSE NULL END);
  END IF;

  IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
    INSERT INTO public.support_issue_events(issue_id, actor_id, event_type, note, metadata)
    VALUES (NEW.id, auth.uid(), 'assignment', 'Assignment changed',
            jsonb_build_object('from', OLD.assigned_to, 'to', NEW.assigned_to));
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_support_issues_status_change_ins
AFTER INSERT ON public.support_issues
FOR EACH ROW EXECUTE FUNCTION public.support_issues_status_change();

CREATE TRIGGER trg_support_issues_status_change_upd
BEFORE UPDATE ON public.support_issues
FOR EACH ROW EXECUTE FUNCTION public.support_issues_status_change();

-- History RPC
CREATE OR REPLACE FUNCTION public.admin_user_issue_history(_user_id UUID)
RETURNS TABLE(
  id UUID,
  title TEXT,
  category TEXT,
  status TEXT,
  priority TEXT,
  lab_result_id UUID,
  assigned_to UUID,
  resolution_summary TEXT,
  resolution_action TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT i.id, i.title, i.category, i.status, i.priority, i.lab_result_id,
         i.assigned_to, i.resolution_summary, i.resolution_action,
         i.resolved_at, i.created_at, i.updated_at
  FROM public.support_issues i
  WHERE i.affected_user_id = _user_id
  ORDER BY i.created_at DESC;
END;
$$;

-- Listing RPC with user info joined
CREATE OR REPLACE FUNCTION public.admin_list_issues(_limit INT DEFAULT 200)
RETURNS TABLE(
  id UUID,
  title TEXT,
  category TEXT,
  status TEXT,
  priority TEXT,
  source TEXT,
  affected_user_id UUID,
  affected_email TEXT,
  affected_name TEXT,
  lab_result_id UUID,
  assigned_to UUID,
  created_by UUID,
  resolution_summary TEXT,
  resolution_action TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT i.id, i.title, i.category, i.status, i.priority, i.source,
         i.affected_user_id, u.email::text, COALESCE(p.full_name,'')::text,
         i.lab_result_id, i.assigned_to, i.created_by,
         i.resolution_summary, i.resolution_action,
         i.resolved_at, i.created_at, i.updated_at
  FROM public.support_issues i
  LEFT JOIN auth.users u ON u.id = i.affected_user_id
  LEFT JOIN public.profiles p ON p.user_id = i.affected_user_id
  ORDER BY
    CASE i.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'reopened' THEN 2
                  WHEN 'waiting_user' THEN 3 WHEN 'resolved' THEN 4 ELSE 5 END,
    CASE i.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
    i.created_at DESC
  LIMIT _limit;
END;
$$;