
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TYPE public.geopolitical_zone AS ENUM (
  'south-south', 'south-west', 'south-east',
  'north-central', 'north-east', 'north-west'
);

CREATE TYPE public.sex_type AS ENUM ('male', 'female');

CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  age INTEGER,
  sex sex_type,
  geopolitical_zone geopolitical_zone,
  ndpa_consent BOOLEAN NOT NULL DEFAULT false,
  medical_disclaimer_accepted BOOLEAN NOT NULL DEFAULT false,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.lab_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  biomarkers JSONB,
  dietary_plan JSONB,
  consultation_checklist JSONB,
  has_critical_alert BOOLEAN NOT NULL DEFAULT false,
  critical_alerts JSONB,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'critical')),
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lab results" ON public.lab_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own lab results" ON public.lab_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own lab results" ON public.lab_results FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_lab_results_updated_at BEFORE UPDATE ON public.lab_results
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public) VALUES ('lab-uploads', 'lab-uploads', false);

CREATE POLICY "Users can upload their own lab files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'lab-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own lab files" ON storage.objects
FOR SELECT USING (bucket_id = 'lab-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own lab files" ON storage.objects
FOR DELETE USING (bucket_id = 'lab-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
