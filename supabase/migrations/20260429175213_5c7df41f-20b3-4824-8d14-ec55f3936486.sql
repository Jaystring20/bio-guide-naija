UPDATE public.lab_results
SET status = 'failed',
    biomarkers = NULL,
    biomarkers_pidgin = NULL,
    ai_summary = NULL,
    ai_summary_pidgin = NULL,
    dietary_plan = NULL,
    dietary_plan_pidgin = NULL,
    consultation_checklist = NULL,
    consultation_checklist_pidgin = NULL,
    has_critical_alert = false,
    critical_alerts = NULL
WHERE id IN (
  'd54ae954-0520-4162-87e2-fb04da2cda46',
  '100df7e6-2bfe-40f1-b483-da3a13d75271'
);