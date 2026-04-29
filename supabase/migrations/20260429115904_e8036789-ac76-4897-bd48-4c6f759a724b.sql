ALTER TABLE public.lab_results ADD COLUMN IF NOT EXISTS processing_steps jsonb;
ALTER TABLE public.lab_results REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lab_results;