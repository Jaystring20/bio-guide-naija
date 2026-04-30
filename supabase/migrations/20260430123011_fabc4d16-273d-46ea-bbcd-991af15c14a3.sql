ALTER TABLE public.lab_results
  ADD COLUMN IF NOT EXISTS biomarker_citations jsonb,
  ADD COLUMN IF NOT EXISTS nutrition_citations jsonb,
  ADD COLUMN IF NOT EXISTS grounding_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS nutrition_status text NOT NULL DEFAULT 'pending';