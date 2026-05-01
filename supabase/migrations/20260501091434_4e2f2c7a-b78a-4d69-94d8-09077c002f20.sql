ALTER TABLE public.lab_results
  ADD COLUMN IF NOT EXISTS fda_safety jsonb,
  ADD COLUMN IF NOT EXISTS fda_safety_status text NOT NULL DEFAULT 'pending';