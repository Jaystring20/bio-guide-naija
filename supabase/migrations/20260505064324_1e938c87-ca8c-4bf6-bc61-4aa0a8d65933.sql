ALTER TABLE public.lab_results ADD COLUMN IF NOT EXISTS feedback_email_sent_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS feedback_signup_email_sent_at timestamptz;