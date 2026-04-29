ALTER TABLE public.lab_results DROP CONSTRAINT IF EXISTS lab_results_status_check;
ALTER TABLE public.lab_results ADD CONSTRAINT lab_results_status_check
  CHECK (status = ANY (ARRAY['processing'::text, 'partial'::text, 'completed'::text, 'failed'::text, 'critical'::text]));