ALTER TABLE public.lab_results
  ADD COLUMN IF NOT EXISTS nafdac_citations jsonb,
  ADD COLUMN IF NOT EXISTS nafdac_status text NOT NULL DEFAULT 'pending';