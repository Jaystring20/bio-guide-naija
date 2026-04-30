-- Add checklist_status to track doctor's-checklist generation lifecycle
-- independently of diet_status, so the two can be regenerated in parallel.
ALTER TABLE public.lab_results
  ADD COLUMN IF NOT EXISTS checklist_status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.lab_results
  DROP CONSTRAINT IF EXISTS lab_results_checklist_status_check;
ALTER TABLE public.lab_results
  ADD CONSTRAINT lab_results_checklist_status_check
  CHECK (checklist_status IN ('pending', 'done', 'failed'));

-- Backfill: existing rows
UPDATE public.lab_results
   SET checklist_status = CASE
     WHEN consultation_checklist IS NOT NULL THEN 'done'
     WHEN status IN ('completed', 'critical') AND upload_date < now() - interval '5 minutes' THEN 'failed'
     ELSE 'pending'
   END
 WHERE checklist_status = 'pending';