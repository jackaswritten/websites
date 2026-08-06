-- Drop the old unique constraint on application_date
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_application_date_key;

-- Add unique constraint on the combination of date and class level
ALTER TABLE public.applications ADD CONSTRAINT applications_date_class_unique UNIQUE (application_date, class_level);

-- Create settings table for supervisor email
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on settings table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings
CREATE POLICY "Anyone can read settings"
ON public.settings
FOR SELECT
USING (true);

-- Allow anyone to insert settings (for initial setup)
CREATE POLICY "Anyone can insert settings"
ON public.settings
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update settings
CREATE POLICY "Anyone can update settings"
ON public.settings
FOR UPDATE
USING (true);

-- Insert default supervisor email
INSERT INTO public.settings (setting_key, setting_value)
VALUES ('supervisor_email', 'supervisor@school.edu')
ON CONFLICT (setting_key) DO NOTHING;