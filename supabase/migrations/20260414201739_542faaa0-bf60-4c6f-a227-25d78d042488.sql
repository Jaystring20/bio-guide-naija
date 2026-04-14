
-- Create dependants table
CREATE TABLE public.dependants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  age INTEGER,
  sex public.sex_type,
  geopolitical_zone public.geopolitical_zone,
  relationship TEXT NOT NULL DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dependants ENABLE ROW LEVEL SECURITY;

-- RLS policies for dependants
CREATE POLICY "Users can view their own dependants"
ON public.dependants FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own dependants"
ON public.dependants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dependants"
ON public.dependants FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dependants"
ON public.dependants FOR DELETE
USING (auth.uid() = user_id);

-- Timestamp trigger for dependants
CREATE TRIGGER update_dependants_updated_at
BEFORE UPDATE ON public.dependants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add dependant_id and test_date to lab_results
ALTER TABLE public.lab_results
ADD COLUMN dependant_id UUID REFERENCES public.dependants(id) ON DELETE SET NULL,
ADD COLUMN test_date DATE;

-- Add user_role to profiles
ALTER TABLE public.profiles
ADD COLUMN user_role TEXT NOT NULL DEFAULT 'personal';
