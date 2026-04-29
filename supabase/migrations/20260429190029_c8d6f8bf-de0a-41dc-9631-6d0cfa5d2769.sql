-- Add diet_status to track diet+checklist generation lifecycle independently of overall status
ALTER TABLE public.lab_results
  ADD COLUMN IF NOT EXISTS diet_status text NOT NULL DEFAULT 'pending';

-- Constrain values
ALTER TABLE public.lab_results
  DROP CONSTRAINT IF EXISTS lab_results_diet_status_check;
ALTER TABLE public.lab_results
  ADD CONSTRAINT lab_results_diet_status_check
  CHECK (diet_status IN ('pending', 'done', 'failed'));

-- Backfill: if dietary_plan exists -> done, else pending (regeneration possible)
UPDATE public.lab_results
   SET diet_status = CASE
     WHEN dietary_plan IS NOT NULL THEN 'done'
     ELSE 'pending'
   END;