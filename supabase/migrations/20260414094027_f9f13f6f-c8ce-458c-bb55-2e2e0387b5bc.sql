ALTER TABLE public.lab_results ADD COLUMN biomarkers_pidgin jsonb;
ALTER TABLE public.lab_results ADD COLUMN dietary_plan_pidgin jsonb;
ALTER TABLE public.lab_results ADD COLUMN consultation_checklist_pidgin jsonb;
ALTER TABLE public.lab_results ADD COLUMN ai_summary_pidgin text;